const {
  ACTIONS,
  extractTrustedEmail,
  decideOAuthAction,
  unverifiedEmailMessage,
} = require('../../services/oauthAccountLinker');

describe('extractTrustedEmail', () => {
  it('reads the verified flag Google puts on the profile entry', () => {
    // passport-google-oauth20 parses the OpenID payload into
    // { value: json.email, verified: json.email_verified }.
    const profile = {
      emails: [{ value: 'Student@Example.com', verified: true }],
    };
    expect(extractTrustedEmail(profile)).toEqual({
      email: 'student@example.com',
      verified: true,
    });
  });

  it('reports an unverified Google address as unverified', () => {
    const profile = { emails: [{ value: 'attacker@example.com', verified: false }] };
    expect(extractTrustedEmail(profile)).toEqual({
      email: 'attacker@example.com',
      verified: false,
    });
  });

  it('honours email_verified when only the raw payload carries it', () => {
    const profile = {
      emails: [{ value: 'student@example.com' }],
      _json: { email: 'student@example.com', email_verified: true },
    };
    expect(extractTrustedEmail(profile).verified).toBe(true);
  });

  it('accepts the string form of the verified flag', () => {
    const profile = { emails: [{ value: 'student@example.com', verified: 'true' }] };
    expect(extractTrustedEmail(profile).verified).toBe(true);
  });

  it('prefers the primary verified address from a GitHub raw email list', () => {
    const profile = {
      emails: [
        { value: 'old@example.com', primary: false, verified: true },
        { value: 'main@example.com', primary: true, verified: true },
      ],
    };
    expect(extractTrustedEmail(profile).email).toBe('main@example.com');
  });

  it('skips an unverified primary in favour of a verified address', () => {
    // The attack shape: attacker adds the victim's address to their GitHub
    // account and makes it primary without verifying it.
    const profile = {
      emails: [
        { value: 'victim@example.com', primary: true, verified: false },
        { value: 'attacker@example.com', primary: false, verified: true },
      ],
    };
    expect(extractTrustedEmail(profile)).toEqual({
      email: 'attacker@example.com',
      verified: true,
    });
  });

  it('treats a bare string address as unverified', () => {
    expect(extractTrustedEmail({ emails: ['someone@example.com'] })).toEqual({
      email: 'someone@example.com',
      verified: false,
    });
  });

  it('returns nothing when the provider supplied no email', () => {
    expect(extractTrustedEmail({ emails: [] })).toEqual({ email: null, verified: false });
    expect(extractTrustedEmail({})).toEqual({ email: null, verified: false });
    expect(extractTrustedEmail(null)).toEqual({ email: null, verified: false });
  });

  it('ignores malformed entries', () => {
    const profile = { emails: [{ value: null }, { notAnEmail: true }] };
    expect(extractTrustedEmail(profile)).toEqual({ email: null, verified: false });
  });
});

describe('decideOAuthAction', () => {
  const account = { id: 'user-1', email: 'student@example.com' };

  it('signs in when the provider id is already linked', () => {
    const result = decideOAuthAction({
      userByProviderId: account,
      email: 'anything@example.com',
      emailVerified: false,
    });
    expect(result.action).toBe(ACTIONS.LOGIN);
  });

  it('links an existing account only on a verified email', () => {
    const result = decideOAuthAction({
      userByEmail: account,
      email: 'student@example.com',
      emailVerified: true,
    });
    expect(result.action).toBe(ACTIONS.LINK);
  });

  it('refuses to link an existing account on an unverified email', () => {
    // This is the takeover: an unverified address matching a local account
    // used to be enough to attach the provider id and sign in as them.
    const result = decideOAuthAction({
      userByEmail: account,
      email: 'student@example.com',
      emailVerified: false,
    });
    expect(result.action).toBe(ACTIONS.REJECT_UNVERIFIED);
  });

  it('refuses to create an account from an unverified email', () => {
    const result = decideOAuthAction({
      userByEmail: null,
      email: 'nobody@example.com',
      emailVerified: false,
    });
    expect(result.action).toBe(ACTIONS.REJECT_UNVERIFIED);
  });

  it('creates a new account for a verified, unclaimed email', () => {
    const result = decideOAuthAction({
      userByEmail: null,
      email: 'new@example.com',
      emailVerified: true,
    });
    expect(result.action).toBe(ACTIONS.CREATE);
  });

  it('asks for an email when the provider gave none', () => {
    const result = decideOAuthAction({ email: null, emailVerified: false });
    expect(result.action).toBe(ACTIONS.NEEDS_EMAIL);
  });

  it('prefers the already-linked identity over an email collision', () => {
    // Both present: the provider id is the stronger signal and must win, so a
    // linked user is never re-linked onto a different account.
    const other = { id: 'user-2', email: 'student@example.com' };
    const result = decideOAuthAction({
      userByProviderId: account,
      userByEmail: other,
      email: 'student@example.com',
      emailVerified: true,
    });
    expect(result.action).toBe(ACTIONS.LOGIN);
  });

  it('defaults to asking for an email when given nothing at all', () => {
    expect(decideOAuthAction().action).toBe(ACTIONS.NEEDS_EMAIL);
  });

  it('always explains itself', () => {
    const result = decideOAuthAction({ email: 'a@b.com', emailVerified: false });
    expect(typeof result.reason).toBe('string');
    expect(result.reason.length).toBeGreaterThan(0);
  });
});

describe('unverifiedEmailMessage', () => {
  it('names the provider and offers a way forward', () => {
    const message = unverifiedEmailMessage('GitHub');
    expect(message).toContain('GitHub');
    expect(message).toMatch(/Settings/);
  });
});

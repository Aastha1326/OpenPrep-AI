/**
 * Decides what an OAuth sign-in is allowed to do with an existing account.
 *
 * The rule that matters: an email address only counts as proof of identity if
 * the provider says it verified it. Both strategies used to link a provider id
 * onto any local account whose email string matched, so control of an
 * unverified address at the provider was enough to take over the OpenPrep
 * account that owned it.
 *
 * Pure functions — no models, no network — so the policy can be tested on its
 * own rather than through a live OAuth round trip.
 */

/** What the caller should do next. */
const ACTIONS = {
  /** The provider id is already on an account. Sign them in. */
  LOGIN: 'login',
  /** Verified email matches an existing account. Safe to attach the provider id. */
  LINK: 'link',
  /** Verified email, nobody owns it. Make a new account. */
  CREATE: 'create',
  /** Provider gave us no usable email. Ask the user for one. */
  NEEDS_EMAIL: 'needs_email',
  /** Provider gave us an email it has not verified. Refuse. */
  REJECT_UNVERIFIED: 'reject_unverified',
};

/** Providers report `verified` as a boolean or as the string 'true'. */
const isVerifiedFlag = (value) => value === true || value === 'true';

/**
 * Pull the address we are willing to trust out of a Passport profile.
 *
 * Prefers the primary verified address, then any verified address. An
 * unverified address is still reported — with `verified: false` — so the
 * caller can tell "GitHub gave us nothing" apart from "GitHub gave us
 * something we must not trust", which are different outcomes for the user.
 *
 * @param {object} profile Passport profile.
 * @returns {{ email: string|null, verified: boolean }}
 */
const extractTrustedEmail = (profile) => {
  const emails = Array.isArray(profile?.emails) ? profile.emails : [];

  const normalize = (entry) => {
    const value = typeof entry === 'string' ? entry : entry?.value;
    if (!value || typeof value !== 'string') return null;
    return {
      email: value.trim().toLowerCase(),
      verified: typeof entry === 'string' ? false : isVerifiedFlag(entry.verified),
      primary: typeof entry === 'string' ? false : entry.primary === true,
    };
  };

  const candidates = emails.map(normalize).filter(Boolean);

  // Google's OpenID parser puts the flag on the entry, but it also lands in the
  // raw payload as email_verified — worth honouring when only the raw form is
  // present.
  const rawVerified = isVerifiedFlag(profile?._json?.email_verified);
  const rawEmail =
    typeof profile?._json?.email === 'string' ? profile._json.email.trim().toLowerCase() : null;

  const verified = candidates.filter(
    (c) => c.verified || (rawVerified && rawEmail && c.email === rawEmail)
  );

  const chosen =
    verified.find((c) => c.primary) ||
    verified[0] ||
    candidates.find((c) => c.primary) ||
    candidates[0] ||
    null;

  if (!chosen) {
    if (rawEmail) {
      return { email: rawEmail, verified: rawVerified };
    }
    return { email: null, verified: false };
  }

  return {
    email: chosen.email,
    verified: chosen.verified || (rawVerified && rawEmail === chosen.email),
  };
};

/**
 * @param {object} input
 * @param {object|null} input.userByProviderId Account already carrying this provider id.
 * @param {object|null} input.userByEmail Account owning the address, if any.
 * @param {string|null} input.email Address reported by the provider.
 * @param {boolean} input.emailVerified Whether the provider verified it.
 * @returns {{ action: string, reason: string }}
 */
const decideOAuthAction = ({
  userByProviderId = null,
  userByEmail = null,
  email = null,
  emailVerified = false,
} = {}) => {
  // Already linked: the provider id is the identity, the email is irrelevant.
  if (userByProviderId) {
    return { action: ACTIONS.LOGIN, reason: 'Provider identity is already linked to an account' };
  }

  if (!email) {
    return { action: ACTIONS.NEEDS_EMAIL, reason: 'Provider did not supply an email address' };
  }

  if (!emailVerified) {
    return {
      action: ACTIONS.REJECT_UNVERIFIED,
      reason: 'Provider has not verified this email address',
    };
  }

  if (userByEmail) {
    return { action: ACTIONS.LINK, reason: 'Verified email matches an existing account' };
  }

  return { action: ACTIONS.CREATE, reason: 'Verified email is not yet registered' };
};

/** Message shown to a user whose provider email is not verified. */
const unverifiedEmailMessage = (provider) =>
  `Your ${provider} email address is not verified. Verify it with ${provider} and try again, ` +
  'or sign in with your password and connect the account from Settings.';

module.exports = {
  ACTIONS,
  extractTrustedEmail,
  decideOAuthAction,
  unverifiedEmailMessage,
};

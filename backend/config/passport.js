const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const {
  ACTIONS,
  extractTrustedEmail,
  decideOAuthAction,
  unverifiedEmailMessage,
} = require('../services/oauthAccountLinker');

/**
 * Resolve a Passport profile to a user.
 *
 * Both strategies used to link a provider id onto any account whose email
 * matched the one the provider reported, without checking whether the provider
 * had verified that address. Control of an unverified address was therefore
 * enough to take over the OpenPrep account that owned it. The policy in
 * services/oauthAccountLinker decides what is allowed; this just carries it out.
 *
 * @param {'google'|'github'} provider
 * @param {string} idField Column holding the provider id.
 * @param {object} profile Passport profile.
 * @param {Function} done
 * @param {boolean} supportsEmailPrompt Whether this provider has a follow-up
 *   flow for collecting an address. GitHub does; Google is asked for the email
 *   scope, so a profile without one is an error rather than a prompt.
 */
const resolveOAuthUser = async (provider, idField, profile, done, supportsEmailPrompt = false) => {
  try {
    const { email, verified } = extractTrustedEmail(profile);
    const providerId = profile.id;

    const userByProviderId = await User.findOne({ where: { [idField]: providerId } });
    const userByEmail = email && !userByProviderId ? await User.findOne({ where: { email } }) : null;

    const { action } = decideOAuthAction({
      userByProviderId,
      userByEmail,
      email,
      emailVerified: verified,
    });

    const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
    const displayName =
      profile.displayName || profile.username || `${provider === 'google' ? 'Google' : 'GitHub'} User`;

    switch (action) {
      case ACTIONS.LOGIN:
        return done(null, userByProviderId);

      case ACTIONS.LINK: {
        userByEmail[idField] = providerId;
        userByEmail.authProvider = provider;
        userByEmail.avatarUrl = avatarUrl || userByEmail.avatarUrl;
        await userByEmail.save();
        return done(null, userByEmail);
      }

      case ACTIONS.CREATE: {
        const created = await User.create({
          name: displayName,
          email,
          [idField]: providerId,
          authProvider: provider,
          avatarUrl,
          // The provider verified this address, so there is nothing left for us
          // to confirm.
          isEmailVerified: true,
          password: null,
        });
        return done(null, created);
      }

      case ACTIONS.NEEDS_EMAIL:
        if (!supportsEmailPrompt) {
          return done(
            new Error('Email is private or not set on your Google account.'),
            null
          );
        }
        // No usable address. The frontend collects one; nothing is linked until
        // that flow completes, and it cannot attach to an existing account.
        return done(null, {
          isTemp: true,
          provider,
          [idField]: providerId,
          name: displayName,
          avatarUrl,
        });

      case ACTIONS.REJECT_UNVERIFIED:
      default:
        return done(new Error(unverifiedEmailMessage(provider)), null);
    }
  } catch (error) {
    return done(error, null);
  }
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'mock_google_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_google_secret',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      proxy: true,
    },
    (accessToken, refreshToken, profile, done) =>
      resolveOAuthUser('google', 'googleId', profile, done)
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || 'mock_github_id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'mock_github_secret',
      callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback',
      proxy: true,
      // Without this passport-github2 reduces /user/emails to the primary
      // address and drops the verified/primary flags, leaving the strategy no
      // way to tell a verified address from an unverified one.
      allRawEmails: true,
    },
    (accessToken, refreshToken, profile, done) =>
      resolveOAuthUser('github', 'githubId', profile, done, true)
  )
);

module.exports = passport;

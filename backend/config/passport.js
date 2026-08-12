const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'mock_google_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_google_secret',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (!email) {
          return done(new Error('Email is private or not set on your Google account.'), null);
        }

        let user = await User.findOne({ where: { googleId: profile.id } });

        if (!user) {
          // Check if email already exists
          user = await User.findOne({ where: { email } });
          if (user) {
            // Link account
            user.googleId = profile.id;
            user.authProvider = 'google';
            user.avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : user.avatarUrl;
            await user.save();
          } else {
            // Create new user
            user = await User.create({
              name: profile.displayName || profile.username || 'Google User',
              email,
              googleId: profile.id,
              authProvider: 'google',
              avatarUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
              password: null,
            });
          }
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || 'mock_github_id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'mock_github_secret',
      callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback',
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

        let user = await User.findOne({ where: { githubId: profile.id } });

        if (!user) {
          if (email) {
            // Check if email already exists
            user = await User.findOne({ where: { email } });
            if (user) {
              // Link account
              user.githubId = profile.id;
              user.authProvider = 'github';
              user.avatarUrl = avatarUrl || user.avatarUrl;
              await user.save();
            } else {
              // Create new user
              user = await User.create({
                name: profile.displayName || profile.username || 'GitHub User',
                email,
                githubId: profile.id,
                authProvider: 'github',
                avatarUrl,
                password: null,
              });
            }
          } else {
            // Email is missing or private.
            return done(null, {
              isTemp: true,
              githubId: profile.id,
              name: profile.displayName || profile.username || 'GitHub User',
              avatarUrl,
            });
          }
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'mock_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_client_secret',
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ where: { socialId: profile.id, provider: 'google' } });

        if (!user) {
          // Check if email already exists
          user = await User.findOne({ where: { email: profile.emails[0].value } });
          if (user) {
            // Link account
            user.socialId = profile.id;
            user.provider = 'google';
            await user.save();
          } else {
            // Create new user
            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              socialId: profile.id,
              provider: 'google',
              password: crypto.randomBytes(16).toString('hex'),
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

const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dotenv = require("dotenv");
dotenv.config();
const User = require("./module/user");
const express = require("express")
const router = express.Router()

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:5500/user/auth/google/callback",
  passReqToCallback: true
},
  async function (req, accessToken, refreshToken, profile, done) {
    console.log(req.cookie)
    try {
      // Find or create user based on Google profile information
      const existingUser = await User.findOne({ email: profile.emails[0].value })
      if (existingUser) {
        return done(null, existingUser);
      }
      else {
        req.flash("error", "Please SignUp first")
        return done(null, null)
      }
    } catch (err) {
      return done(err);
    }
  }
));



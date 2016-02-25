var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
var configAuth = require('../config/auth');
var Account = require('../models/account');

// expose this function to our app using module.exports
module.exports = function(passport) {


// =========================================================================
// GOOGLE ==================================================================
// =========================================================================
passport.use(new GoogleStrategy({

    clientID        : configAuth.googleAuth.clientID,
    clientSecret    : configAuth.googleAuth.clientSecret,
    callbackURL     : configAuth.googleAuth.callbackURL,

},
function(token, refreshToken, profile, done) {
    // make the code asynchronous
    // User.findOne won't fire until we have all our data back from Google
    process.nextTick(function() {

        // try to find the user based on their google id
        Account.findOne({ 'username' : profile.displayName }, function(err, user) {
            if (err)
                return done(err);

            if (user) {

                // if a user is found, log them in
                return done(null, user);
            } else {
                // if the user isnt in our database, create a new user
                var account = new Account({username: profile.displayName});

                // set all of the relevant information
                //account.google.id    = profile.id;
                //account.google.token = token;
                //account.google.name  = profile.displayName;
                //account.google.email = profile.emails[0].value; // pull the first email

                // save the user
                Account.register(account, token, function(err, account) {
                  if (err) {
                    return done(null, user);
                  }

                });

            }
        });
    });

}));


// =========================================================================
// LINKEDIN ================================================================
// =========================================================================
passport.use(new LinkedInStrategy({
        // pull in our app id and secret from our auth.js file
        clientID        : configAuth.linkedinAuth.clientID,
        clientSecret    : configAuth.linkedinAuth.clientSecret,
        callbackURL     : configAuth.linkedinAuth.callbackURL,
        scope: ['r_emailaddress', 'r_basicprofile'],
        state: true
  },
  function(token, tokenSecret, profile, done) {

    // make the code asynchronous
    process.nextTick(function() {

        var linkedinName = profile.displayName;
        // try to find the user based on their google id
        Account.findOne({ 'username' : linkedinName }, function(err, user) {
            if (err)
                return done(err);

            if (user) {

                // if a user is found, log them in
                return done(null, user);
            } else {
                // if the user isnt in our database, create a new user
                var account = new Account({username: linkedinName});

                // save the user
                Account.register(account, token, function(err, account) {
                  if (err) {
                    return done(null, user);
                  }

                });

            }
        });
    });
}));


// =========================================================================
// FACEBOOK ================================================================
// =========================================================================
passport.use(new FacebookStrategy({

        // pull in our app id and secret from our auth.js file
        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL

    },

function(token, refreshToken, profile, done) {
    // make the code asynchronous
    // User.findOne won't fire until we have all our data back from Google
    process.nextTick(function() {

        // try to find the user based on their google id
        Account.findOne({ 'username' : profile.displayName }, function(err, user) {
            if (err)
                return done(err);

            if (user) {

                // if a user is found, log them in
                return done(null, user);
            } else {
                // if the user isnt in our database, create a new user
                var account = new Account({username: profile.displayName});

                // set all of the relevant information
                //account.google.id    = profile.id;
                //account.google.token = token;
                //account.google.name  = profile.displayName;
                //account.google.email = profile.emails[0].value; // pull the first email

                // save the user
                Account.register(account, token, function(err, account) {
                  if (err) {
                    return done(null, user);
                  }

                });

            }
        });
    });

}));

passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());



};
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
        Account.findOne({ 'username' : profile.emails[0].value }, function(err, user) {
            if (err)
                return done(err);

            if (user) {

                // if a user is found, log them in
                return done(null, user);
            } else {
                var lookupNickname = "";
                if(profile.displayName){
                    lookupNickname = profile.displayName;
                } else if (profile.name && profilen.name.givenName && profile.name.familyName){
                    lookupNickname = profilen.name.givenName + " " + profile.name.familyName;
                } else {
                    lookupNickname = "user-" + Date.now();
                }


                Account.find({"nickname" : {$regex : ".*"+lookupNickname+".*"} }, function(err, nicknames){
                    var newNickname;
                    if(nicknames.length == 0){
                        newNickname = lookupNickname;
                    } else {
                        newNickname = lookupNickname + "-" + (nicknames.length + 1).toString();
                    }

                    if(!newNickname){
                        newNickname = "user-" + Date.now();
                    }

                    // if the user isnt in our database, create a new user
                    var account = new Account({
                        nickname : newNickname
                    });

                    if(profile.name && profile.name.givenName){
                        account.firstname =  profile.name.givenName;
                    }
                    if(profile.name && profile.name.familyName){
                        account.lastname = profile.name.familyName;
                    }
                    if(profile.emails[0].value){
                        account.username = profile.emails[0].value;
                    }


                    Account.create(account, function (err, account) {
                      if (err) console.log(err);
                      else console.log("New account created.");
                      return done(null, account);
                    });

                })

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
        Account.findOne({ 'username' : profile.emails[0].value }, function(err, user) {
            if (err)
                return done(err);

            if (user) {

                // if a user is found, log them in
                return done(null, user);
            } else {
                var lookupNickname = "";
                if(profile.displayName){
                    lookupNickname = profile.displayName;
                } else if (profile.name && profilen.name.givenName && profile.name.familyName){
                    lookupNickname = profilen.name.givenName + " " + profile.name.familyName;
                } else {
                    lookupNickname = "user-" + Date.now();
                }


                Account.find({"nickname" : {$regex : ".*"+lookupNickname+".*"} }, function(err, nicknames){
                    var newNickname;
                    if(nicknames.length == 0){
                        newNickname = lookupNickname;
                    } else {
                        newNickname = lookupNickname + "-" + (nicknames.length + 1).toString();
                    }

                    if(!newNickname){
                        newNickname = "user-" + Date.now();
                    }

                    var account = new Account({
                        nickname : newNickname
                    });

                    if(profile.name && profile.name.givenName){
                        account.firstname =  profile.name.givenName;
                    }
                    if(profile.name && profile.name.familyName){
                        account.lastname = profile.name.familyName;
                    }
                    if(profile.emails[0].value){
                        account.username = profile.emails[0].value;
                    }

                    Account.create(account, function (err, account) {
                      if (err) console.log(err);
                      else console.log("New account created.");
                      return done(null, account);
                    });
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
        callbackURL     : configAuth.facebookAuth.callbackURL,
        profileFields: ['id', 'photos', 'emails', 'name']

    },

function(token, refreshToken, profile, done) {
    // make the code asynchronous
    // User.findOne won't fire until we have all our data back from Google
    process.nextTick(function() {

        if(profile.emails.length == 0 || !profile.emails[0].value){
            return done(err);
        }

        // try to find the user based on their google id
        Account.findOne({ 'username' : profile.emails[0].value  }, function(err, user) {
            if (err)
                return done(err);

            if (user) {

                // if a user is found, log them in
                return done(null, user);
            } else {

                var lookupNickname = "";
                if(profile.displayName){
                    lookupNickname = profile.displayName;
                } else if (profile.name && profilen.name.givenName && profile.name.familyName){
                    lookupNickname = profilen.name.givenName + " " + profile.name.familyName;
                } else {
                    lookupNickname = "user-" + Date.now();
                }


                Account.find({"nickname" : {$regex : ".*"+lookupNickname+".*"} }, function(err, nicknames){
                    var newNickname;
                    if(nicknames.length == 0){
                        newNickname = lookupNickname;
                    } else {
                        newNickname = lookupNickname + "-" + (nicknames.length + 1).toString();
                    }

                    if(!newNickname){
                        newNickname = "user-" + Date.now();
                    }

                    // if the user isnt in our database, create a new user
                    var account = new Account({
                        nickname : newNickname
                    });

                    if(profile.name && profile.name.givenName){
                        account.firstname =  profile.name.givenName;
                    }
                    if(profile.name && profile.name.familyName){
                        account.lastname = profile.name.familyName;
                    }
                    if(profile.emails[0].value){
                        account.username = profile.emails[0].value;
                    }

                    Account.create(account, function (err, account) {
                      if (err) console.log(err);
                      else console.log("New account created.");
                      return done(null, account);
                    });
                });
            }
        });
    });

}));

passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());



};
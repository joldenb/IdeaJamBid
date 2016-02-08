var cool = require('cool-ascii-faces');
var express = require('express');
var mongodb = require('mongodb');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo/es5')(session);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
var configAuth = require('./config/auth');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// not sure about this one
app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Setting up the database connection and session storage
var mongodbUri = process.env.MONGOLAB_URI || 'localhost:27017/nodetest1';
mongoose.connect(mongodbUri);
var db = mongoose.connection;
app.use(session({
    secret: 'foo', store: new MongoStore({ mongooseConnection: mongoose.connection})
}));
db.on('error', console.error.bind(console, 'Database connection error:'));
db.once('open', console.error.bind(console, 'Connected to MongDB'));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);

// passport config
var Account = require('./models/account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

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
                    return ;
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
                    return ;
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
                    return ;
                  }

                });

            }
        });
    });

}));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;

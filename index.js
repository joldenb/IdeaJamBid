var cool = require('cool-ascii-faces');
var express = require('express');
var mongodb = require('mongodb');
var aws = require('aws-sdk');
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
var socialRoutes = require('./routes/social-routes');
var networkRoutes = require('./routes/network-routes');
var valueWasteRoutes = require('./routes/value-waste-routes');
var ideaDataRoutes = require('./routes/idea-data-routes');
var Account = require('./models/account');


require('./config/passport')(passport);

var app = express();

// not sure about this one
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));


// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(cookieParser());

// Setting up the database connection and session storage
var mongodbUri = process.env.MONGOLAB_URI || 'localhost:27017/nodetest1';

console.log("SEEANNNNN:" + mongodbUri);

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
app.use('/', networkRoutes);
app.use('/', socialRoutes);
app.use('/', valueWasteRoutes);
app.use('/', ideaDataRoutes);


// passport config
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());


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

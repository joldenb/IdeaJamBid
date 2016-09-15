var nr = require('newrelic');
var cool = require('cool-ascii-faces');
var express = require('express');
var helmet = require('helmet')
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
var emailRoutes = require('./routes/email-routes');
var networkRoutes = require('./routes/network-routes');
var valueWasteRoutes = require('./routes/value-waste-routes');
var valueWasteMobileRoutes = require('./routes/value-waste-mobile-routes');
var ideaDataRoutes = require('./routes/idea-data-routes');
var Account = require('./models/account');
var csrf = require('csurf');
var RateLimit = require('express-rate-limit');
var enforce = require('express-sslify');
var forceSSL = require('express-force-ssl');


require('./config/passport')(passport);

var app = express();

app.locals.moment = require('moment');
// Set your region for future requests.
aws.config.region = 'us-west-2';

app.use(helmet());

var ninetyDaysInMilliseconds = 7776000000;
app.use(helmet.hsts({ maxAge: ninetyDaysInMilliseconds, includeSubdomains: true }))

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
var mongodbUri = process.env.MONGOATLAS_URI || process.env.MONGOLAB_URI || 'localhost:27017/nodetest1';

console.log("mongodbUri:" + mongodbUri);

if(process.env.MONGOATLAS_URI){
  console.log("connecting to mongoatlas")
  mongoose.connect(mongodbUri, {
      replset: {
        rs_name: 'Cluster0-shard-0'
        
      }
    }, function(err) {
      if (err) {
        console.log(err);
        process.exit();
      }
      else {
        console.log("Everything is ok :D");
      }
    });
} else {
  console.log("connecting mlab or local")
  mongoose.connect(mongodbUri);
}
var db = mongoose.connection;
app.use(session({
    secret: 'foo', store: new MongoStore({ mongooseConnection: mongoose.connection})
}));
db.on('error', console.error.bind(console, 'Database connection error:'));
db.once('open', console.error.bind(console, 'Connected to MongDB'));

app.use(passport.initialize());
app.use(passport.session());

app.use(csrf({ cookie: true }));

app.use('/', routes);
app.use('/', networkRoutes);
app.use('/', socialRoutes);
app.use('/', emailRoutes);
app.use('/', valueWasteRoutes);
app.use('/', valueWasteMobileRoutes);
app.use('/', ideaDataRoutes);


// passport config
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

app.use(function(req, res) {
  res.status(404);
  res.render('pages/404.jade', {title: '404: File Not Found'});
});

app.enable('trust proxy'); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc)

var limiter = new RateLimit({
  windowMs: 3*60*1000, // 3 minutes
  max: 2000, // limit each IP to 100 requests per windowMs
  delayMs: 0, // disable delaying - full speed until the max limit is reached
	handler:  function (req, res) {
		res.format({
			html: function(){
				res.status(options.statusCode).end(options.message);
			},
			json: function(){
				res.status(options.statusCode).json({ message: options.message });
			}
		});
	}
});

console.log("node version: " + process.version);
console.log("environment " + process.env.NODE_ENV);

if(process.env.NODE_ENV == "production"){
	console.log("enforcing https");
  app.use(enforce.HTTPS());

  app.use(forceSSL);

  app.set('forceSSLOptions', {
    enable301Redirects: true,
    trustXFPHeader: false,
    httpsPort: 443,
    sslRequiredMessage: 'SSL Required.'
  });
}
//  apply to all requests
app.use(limiter);



app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;

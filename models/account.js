var mongoose = require('mongoose');
require('../models/aptitude');
var Schema = mongoose.Schema;
var StripeCredentials = require('../models/stripeCredentials');
var UserPayout = require('../models/userPayout');
var passportLocalMongoose = require('passport-local-mongoose');
var IdeaSeed = mongoose.model('IdeaSeed').schema;
var StripeCredentials = mongoose.model('StripeCredentials');
var ObjectId = mongoose.Schema.Types.ObjectId;
var validator = require('validator');
var autopopulate = require('mongoose-autopopulate');

var Account = new Schema({
    resetToken      : String,
    firstname       : String,
    lastname        : String,
    nickname        : {type: String, unique: true},
    username		: {type: String, unique: true},
    password		: String,
    identifier      : String,
    einsteinPoints	: {type: Number, default:0},
    einsteinHistory : [String],
    rupees			: {type: Number, default:0},
    ideaSeeds       : [{type: Schema.Types.ObjectId, ref: 'IdeaSeed', autopopulate: true }],
    aptitudes       : [{type: Schema.Types.ObjectId, ref: 'Aptitude', autopopulate: true }],
    userPayouts     : [{type: Schema.Types.ObjectId, ref: 'UserPayout'}],
    stripeCredentials : {type: Schema.Types.ObjectId, ref: 'StripeCredentials', autopopulate: true },
    headshots		: [{
        filename : String,
        imageMimetype : String,
        amazonURL : String,
        uploader : String, //username
        orientation : String
    }], //whatever's first on the list is the main picture
    networks		: {
			school : ObjectId,
			company : ObjectId,
			location	: ObjectId
    },
    otherNetworks   : [ObjectId], //for now there's up to three, all ids for network ids
    pendingNetworks : [ObjectId]
}, { autoIndex: false });

var minLength = 8;
var maxLength = 32;

var validatePassword = function(password, cb) {
    if (!validator.isLength(password, minLength, maxLength)) {
        return cb({code: 400, message: "Password should be between " + minLength + " and " + maxLength + " chars"});
    }
    return cb(null);
};

var options = {
    interval: 1000, //specifies the interval in milliseconds between login attempts. Default: 100.
    limitAttempts: true, //specifies whether login attempts should be limited and login failures should be penalized. Default: false.
    maxAttempts: 10, //specifies the maximum number of failed attempts allowed before preventing login. Default: Infinity.
    passwordValidator: validatePassword, //specifies your custom validation function for the password in the form 'function(password,cb)'. Default: validates non-empty passwords.
};

Account.plugin(passportLocalMongoose, options);
Account.plugin(autopopulate);

module.exports = mongoose.model('Account', Account);
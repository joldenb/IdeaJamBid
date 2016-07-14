var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var IdeaSeed = mongoose.model('IdeaSeed').schema;
var ObjectId = mongoose.Schema.Types.ObjectId;
var validator = require('validator');

var Account = new Schema({
    username		: String,
    password		: String,
    einsteinPoints	: {type: Number, default:0},
    rupees			: {type: Number, default:0},
    ideaSeeds		: [IdeaSeed],
    headshots		: [ObjectId], //whatever's first on the list is the main picture
    aptitudes       : [ObjectId],
    networks		: {
			school : ObjectId,
			company : ObjectId,
			location	: ObjectId
    } //for now there's up to three, all ids for network ids
});

var minLength = 8;
var maxLength = 32;

var validatePassword = function(password, cb) {
    if (!validator.isLength(password, minLength, maxLength)) {
        return cb({code: 400, message: "Password should be between " + minLength + " and " + maxLength + " chars"});
    }
    return cb(null);
}

var options = {
    interval: 1000, //specifies the interval in milliseconds between login attempts. Default: 100.
    limitAttempts: true, //specifies whether login attempts should be limited and login failures should be penalized. Default: false.
    maxAttempts: 10, //specifies the maximum number of failed attempts allowed before preventing login. Default: Infinity.
    passwordValidator: validatePassword, //specifies your custom validation function for the password in the form 'function(password,cb)'. Default: validates non-empty passwords.
}

Account.plugin(passportLocalMongoose, options);

module.exports = mongoose.model('Account', Account);
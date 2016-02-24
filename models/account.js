var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var IdeaSeed = mongoose.model('IdeaSeed');

var Account = new Schema({
    username		: String,
    password		: String,
    einsteinPoints	: {type: Number, default:0},
    rupees			: {type: Number, default:0},
    ideaSeeds		: [IdeaSeed]
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);
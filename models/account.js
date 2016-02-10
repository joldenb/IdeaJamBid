var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var IdeaSeed = require('./IdeaSeed');

var Account = new Schema({
    username		: String,
    password		: String,
    einsteinPoints	: Number,
    rupees			: Number,
    ideaSeeds		: [IdeaSeed]
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var IdeaSeed = mongoose.model('IdeaSeed').schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var Account = new Schema({
    username		: String,
    password		: String,
    einsteinPoints	: {type: Number, default:0},
    rupees			: {type: Number, default:0},
    ideaSeeds		: [IdeaSeed],
    headshots		: [ObjectId] //whatever's first on the list is the main picture
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);
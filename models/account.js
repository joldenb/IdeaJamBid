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
    headshots		: [ObjectId], //whatever's first on the list is the main picture
    networks		: {
			school : ObjectId,
			company : ObjectId,
			location	: ObjectId
    } //for now there's up to three, all ids for network ids
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);
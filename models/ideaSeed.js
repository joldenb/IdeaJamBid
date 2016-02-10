var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var IdeaSeed = new Schema({
	name		: String,
	date		: Date
});

IdeaSeed.plugin(passportLocalMongoose);

module.exports = mongoose.model('IdeaSeed', IdeaSeed);
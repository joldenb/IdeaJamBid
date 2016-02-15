var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var IdeaSeed = new Schema({
	name		: String,
	description	: String
});


module.exports = mongoose.model('IdeaSeed', IdeaSeed);
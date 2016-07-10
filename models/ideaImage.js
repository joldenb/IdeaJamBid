var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var IdeaImage = new Schema({
	filename		: String,
	image			: Buffer,
	amazonURL : String,
	orientation : { type: Number, default: 1 },
	imageMimetype	: String,
	uploader		: String //should match the username field of an account

});

IdeaImage.plugin(passportLocalMongoose);

module.exports = mongoose.model('IdeaImage', IdeaImage);
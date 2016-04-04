var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var IdeaImage = new Schema({
	filename		: String,
	image			: Buffer,
	imageMimetype	: String,
	annotations		: [{
		text		: String,
		xCoord		: String,
		yCoord		: String,
		width		: String,
		height		: String
	}]
});

IdeaImage.plugin(passportLocalMongoose);

module.exports = mongoose.model('IdeaImage', IdeaImage);
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var IdeaSeed = new Schema({
	name			: String,
	description		: String,
	problem			: String,
	firstFeature	: String,
	secondFeature	: String,
	thirdFeature	: String,
	performOne		: Number,
	performTwo		: Number,
	performThree	: Number,
	affordOne		: Number,
	featureOne		: Number,
	deliverOne		: Number,
	useabilityOne	: Number,
	maintainOne		: Number,
	durabilityOne	: Number,
	imageOne		: Number,
	complexOne		: Number,
	precisionOne	: Number,
	variabilityOne	: Number,
	sensitivityOne	: Number,
	immatureOne		: Number,
	dangerOne		: Number,
	skillsOne		: Number
});


module.exports = mongoose.model('IdeaSeed', IdeaSeed);
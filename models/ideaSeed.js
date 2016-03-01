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
	performProblem		: String,

	affordOne		: Number,
	affordProblem		: String,

	featureOne		: Number,
	featureProblem		: String,

	deliverOne		: Number,
	deliverProblem		: String,

	useabilityOne	: Number,
	useabilityProblem	: String,

	maintainOne		: Number,
	maintainProblem		: String,

	durabilityOne	: Number,
	durabilityProblem	: String,

	imageOne		: Number,
	imageProblem		: String,

	complexOne		: Number,
	complexProblem		: String,

	precisionOne	: Number,
	precisionProblem	: String,

	variabilityOne	: Number,
	variabilityProblem	: String,

	sensitivityOne	: Number,
	sensitivityProblem	: String,

	immatureOne		: Number,
	immatureProblem		: String,

	dangerOne		: Number,
	dangerProblem		: String,

	skillsOne		: Number,
	skillsProblem		: String
});


module.exports = mongoose.model('IdeaSeed', IdeaSeed);
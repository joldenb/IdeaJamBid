var mongoose = require('mongoose');
var _ = require('underscore');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var officegen = require('officegen');
var fs = require('fs');
var ObjectId = mongoose.Schema.Types.ObjectId;


var IdeaReview = new Schema({
	ideaSeedId		: ObjectId,
	variant				: String,

	performOne		: Number,
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

IdeaReview.plugin(passportLocalMongoose);

module.exports = mongoose.model('IdeaReview', IdeaReview);
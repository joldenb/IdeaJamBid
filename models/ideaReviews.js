var mongoose = require('mongoose');
var _ = require('underscore');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var officegen = require('officegen');
var fs = require('fs');
var ObjectId = mongoose.Schema.Types.ObjectId;


var IdeaReview = new Schema({
	ideaSeedId		: ObjectId,
	reviewer			: String,
	variant				: String,

	performOne		: Number,
	performProblem		: String,
	performPriority		: { type: Number, default: 1 },

	affordOne		: Number,
	affordProblem		: String,
	affordPriority		: { type: Number, default: 2 },

	featureOne		: Number,
	featureProblem		: String,
	featurePriority		: { type: Number, default: 3 },

	deliverOne		: Number,
	deliverProblem		: String,
	deliverPriority		: { type: Number, default: 4 },

	useabilityOne	: Number,
	useabilityProblem	: String,
	useabilityPriority		: { type: Number, default: 5 },

	maintainOne		: Number,
	maintainProblem		: String,
	maintainPriority		: { type: Number, default: 6 },

	durabilityOne	: Number,
	durabilityProblem	: String,
	durabilityPriority		: { type: Number, default: 7 },

	imageOne		: Number,
	imageProblem		: String,
	imagePriority		: { type: Number, default: 8 },

	complexOne		: Number,
	complexProblem		: String,
	complexPriority		: { type: Number, default: 9 },

	precisionOne	: Number,
	precisionProblem	: String,
	precisionPriority		: { type: Number, default: 10 },

	variabilityOne	: Number,
	variabilityProblem	: String,
	variabilityPriority		: { type: Number, default: 11 },

	sensitivityOne	: Number,
	sensitivityProblem	: String,
	sensitivityPriority		: { type: Number, default: 12 },

	immatureOne		: Number,
	immatureProblem		: String,
	immaturePriority		: { type: Number, default: 13 },

	dangerOne		: Number,
	dangerProblem		: String,
	dangerPriority		: { type: Number, default: 14 },

	skillsOne		: Number,
	skillsProblem		: String,
	skillsPriority		: { type: Number, default: 15 }

},{ autoIndex: false });

IdeaReview.statics.getListOfReviewerProblems = function(reviews) {
	var problems = [], review;
  for(var i = 0; i < reviews.length; i++){
		review = reviews[i];
		if(review["performProblem"]){
			problems.push(["Performance", review["performProblem"], review["performPriority"], review["reviewer"] ]);
		}
		if(review["affordProblem"]){
			problems.push(["Affordability", review["affordProblem"], review["affordPriority"], review["reviewer"] ]);
		}
		if(review["featureProblem"]){
			problems.push(["Featurability", review["featureProblem"], review["featurePriority"], review["reviewer"] ]);
		}
		if(review["deliverProblem"]){
			problems.push(["Deliverability", review["deliverProblem"], review["deliverPriority"], review["reviewer"] ]);
		}
		if(review["useabilityProblem"]){
			problems.push(["Useability", review["useabilityProblem"], review["useabilityPriority"], review["reviewer"] ]);
		}
		if(review["maintainProblem"]){
			problems.push(["Maintainability", review["maintainProblem"], review["maintainPriority"], review["reviewer"] ]);
		}
		if(review["durabilityProblem"]){
			problems.push(["Durability", review["durabilityProblem"], review["durabilityPriority"], review["reviewer"] ]);
		}
		if(review["imageProblem"]){
			problems.push(["Imageability", review["imageProblem"], review["imagePriority"], review["reviewer"] ]);
		}
		if(review["complexProblem"]){
			problems.push(["Complexity", review["complexProblem"], review["complexPriority"], review["reviewer"] ]);
		}
		if(review["precisionProblem"]){
			problems.push(["Precision", review["precisionProblem"], review["precisionPriority"], review["reviewer"] ]);
		}
		if(review["variabilityProblem"]){
			problems.push(["Variability", review["variabilityProblem"], review["variabilityPriority"], review["reviewer"] ]);
		}
		if(review["sensitivityProblem"]){
			problems.push(["Sensitivity", review["sensitivityProblem"], review["sensitivityPriority"], review["reviewer"] ]);
		}
		if(review["immatureProblem"]){
			problems.push(["Immaturity", review["immatureProblem"], review["immaturePriority"], review["reviewer"] ]);
		}
		if(review["dangerProblem"]){
			problems.push(["Danger", review["dangerProblem"], review["dangerPriority"], review["reviewer"] ]);
		}
		if(review["skillsProblem"]){
			problems.push(["Skills", review["skillsProblem"], review["skillsPriority"], review["reviewer"] ]);
		}
	}
	return problems;
};


IdeaReview.plugin(passportLocalMongoose);

module.exports = mongoose.model('IdeaReview', IdeaReview);
var mongoose = require('mongoose');
var _ = require('underscore');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var officegen = require('officegen');
var fs = require('fs');
var ObjectId = mongoose.Schema.Types.ObjectId;


var IdeaReview = new Schema({
	ideaSeedId		: ObjectId,
	reviewer			: String, /* should be username */
	variant				: String,


	/* the fields ending in ***One are the scores that a person 
	gives another invention in a review */
	performOne		: Number,
	performPriority		: { type: Number, default: 1 },

	affordOne		: Number,
	affordPriority		: { type: Number, default: 2 },

	featureOne		: Number,
	featurePriority		: { type: Number, default: 3 },

	deliverOne		: Number,
	deliverPriority		: { type: Number, default: 4 },

	useabilityOne	: Number,
	useabilityPriority		: { type: Number, default: 5 },

	maintainOne		: Number,
	maintainPriority		: { type: Number, default: 6 },

	durabilityOne	: Number,
	durabilityPriority		: { type: Number, default: 7 },

	imageOne		: Number,
	imagePriority		: { type: Number, default: 8 },

	complexOne		: Number,
	complexPriority		: { type: Number, default: 9 },

	precisionOne	: Number,
	precisionPriority		: { type: Number, default: 10 },

	variabilityOne	: Number,
	variabilityPriority		: { type: Number, default: 11 },

	sensitivityOne	: Number,
	sensitivityPriority		: { type: Number, default: 12 },

	immatureOne		: Number,
	immaturePriority		: { type: Number, default: 13 },

	dangerOne		: Number,
	dangerPriority		: { type: Number, default: 14 },

	skillsOne		: Number,
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


IdeaReview.statics.averageViabilityScores = function(reviewObjects){
	/*average the value scores of each review, then average the waste scores, then
		subtract the waste from the value, then average that number across all the objects
	*/

	var reviewAverages = [];
	_.each(reviewObjects, function(review, index, list){
		var reviewValueSum = 0, reviewWasteSum = 0,
				totalValueScores = 0, totalWasteScores = 0,
				reviewValueAve = 0, reviewWasteAve = 0,
				reviewAveScore = 0;
			
			_.each(["performOne",
				"affordOne",
				"featureOne",
				"deliverOne",
				"useabilityOne",
				"maintainOne",
				"durabilityOne",
				"imageOne"], function(field, fieldIndex, fieldList){
					if(review[field]){
						reviewValueSum += review[field];
						totalValueScores++;
					}
			});
			if(reviewValueSum > 0){
				reviewValueAve = reviewValueSum / totalValueScores;
			} else {
				reviewValueAve = 0;
			}

			_.each(["complexOne",
				"precisionOne",
				"variabilityOne",
				"sensitivityOne",
				"immatureOne",
				"dangerOne",
				"skillsOne"], function(field, fieldIndex, fieldList){
					if(review[field]){
						reviewWasteSum += review[field];
						totalWasteScores++;
					}
			});
			if(reviewWasteSum){
				reviewWasteAve = reviewWasteSum / totalWasteScores;
			} else {
				reviewWasteAve = 0;
			}

			reviewAveScore = reviewValueAve - reviewWasteAve;

			reviewAverages.push(reviewAveScore);
	});

	var overallAverage = 0, total = 0;
	_.each(reviewAverages, function(score, index){
		total += score;
	});
	if(reviewAverages.length > 0){
		overallAverage = total / (reviewAverages.length);
	}

	overallAverage = (100 + overallAverage)/2;

	return overallAverage;
};

IdeaReview.plugin(passportLocalMongoose);

module.exports = mongoose.model('IdeaReview', IdeaReview);
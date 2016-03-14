var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var officegen = require('officegen');
var fs = require('fs');

var IdeaSeed = new Schema({
	name			: String,
	purposeFor		: String,
	purposeHow		: String,
	description		: String,
	problem			: String,
	image			: Buffer,
	imageMimetype	: String,
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

IdeaSeed.statics.createApplication = function(idea, res){
	var docx = officegen ( 'docx' );

	var pObj = docx.createP ();
    pObj.addText ( 'Simple' );
    var out = fs.createWriteStream ( './public/output.docx' );

	docx.generate ( out, {
		'finalize': function ( written ) {
			console.log ( 'Finish to create a Word file.\nTotal bytes created: ' + written + '\n' );
			res.download(__dirname + '/../public/output.docx', 'outputOne.docx', function(err){
				if (err) {
					console.log('my error is' + err);
				} else {
					console.log('yay');
				}
			});
		},
		'error': function ( err ) {
			console.log ( err );
		}
	});
	return '/public/output.docx';
};

module.exports = mongoose.model('IdeaSeed', IdeaSeed);
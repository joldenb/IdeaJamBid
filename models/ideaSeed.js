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

IdeaSeed.statics.createApplication = function(idea, account, res){
		res.writeHead ( 200, {
			"Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			'Content-disposition': 'attachment; filename=PreliminaryApplication.docx'
		});

		var docx = officegen ( 'docx' );

		docx.on ( 'finalize', function ( written ) {
			console.log ( 'Finish to create a Word file.\nTotal bytes created: ' + written + '\n' );
		});

		docx.on ( 'error', function ( err ) {
			console.log ( 'Errors: ' + err + '\n' );
		});


		var pObj = docx.createP ({ align: 'center' });
		pObj.addText ( 'Preliminary Application for', { font_size: 30 } );
		pObj = docx.createP ({ align: 'center' });
		pObj.addText( '', { font_size : 25 } );
		pObj = docx.createP ({ align: 'center' });
		pObj.addText ( idea.name, { font_size: 30 } );
		pObj = docx.createP ({ align: 'center' });
		pObj.addText( '', { font_size : 25 } );
		pObj = docx.createP ({ align: 'center' });
		pObj.addText( 'By : ', { font_size : 25 } );
		pObj = docx.createP ({ align: 'center' });
		pObj.addText( account.username, { font_size : 25 } );

		docx.putPageBreak ();

		pObj = docx.createP ();
		pObj.addText( 'Idea Description', { font_size : 25 } );
		pObj = docx.createP ();
		pObj.addText( idea.description, {font_size : 14});
		pObj = docx.createP ();
		pObj.addText( '', { font_size : 25 } );
		pObj = docx.createP ();
		pObj.addText( 'Problem It Will Solve', { font_size : 25 } );
		pObj = docx.createP ();
		pObj.addText( idea.problem, {font_size : 14});

		docx.putPageBreak ();

		pObj = docx.createP ();
		pObj.addText( 'Value Scores and Problems', { font_size : 25 } );
		pObj = docx.createP ();
		pObj.addText( "Performability: " + idea.performOne, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( idea.performProblem, { font_size : 14 } );
		pObj = docx.createP ();
		pObj.addText( "Affordability: " + idea.affordOne, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( idea.affordProblem, { font_size : 14 } );
		pObj = docx.createP ();
		pObj.addText( "Featurability: " + idea.featureOne, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( idea.featureProblem, { font_size : 14 } );
		pObj = docx.createP ();
		pObj.addText( "Deliverability: " + idea.deliverOne, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( idea.deliverProblem, { font_size : 14 } );
		pObj = docx.createP ();
		pObj.addText( "Useability: " + idea.useabilityOne, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( idea.useabilityProblem, { font_size : 14 } );
		pObj = docx.createP ();
		pObj.addText( "Maintainability: " + idea.maintainOne, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( idea.maintainProblem, { font_size : 14 } );
		pObj = docx.createP ();
		pObj.addText( "Durability: " + idea.durabilityOne, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( idea.durabilityProblem, { font_size : 14 } );
		pObj = docx.createP ();
		pObj.addText( "Imageability: " + idea.imageOne, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( idea.imageProblem, { font_size : 14 } );

		docx.putPageBreak ();

		pObj = docx.createP ();
		pObj.addText( 'Waste Scores and Problems', { font_size : 25 } );
		pObj = docx.createP ();
		pObj.addText( "Complexity: " + idea.complexOne, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( idea.complexProblem, { font_size : 14 } );
		pObj = docx.createP ();
		pObj.addText( "Precision: " + idea.precisionOne, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( idea.precisionProblem, { font_size : 14 } );
		pObj = docx.createP ();
		pObj.addText( "Variability: " + idea.variabilityOne, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( idea.variabilityProblem, { font_size : 14 } );
		pObj = docx.createP ();
		pObj.addText( "Sensitivity: " + idea.sensitivityOne, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( idea.sensitivityProblem, { font_size : 14 } );
		pObj = docx.createP ();
		pObj.addText( "Immaturity: " + idea.immatureOne, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( idea.immatureProblem, { font_size : 14 } );
		pObj = docx.createP ();
		pObj.addText( "Danger: " + idea.dangerOne, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( idea.dangerProblem, { font_size : 14 } );
		pObj = docx.createP ();
		pObj.addText( "Skills Required: " + idea.skillsOne, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( idea.skillsProblem, { font_size : 14 } );

		docx.generate ( res );

};

module.exports = mongoose.model('IdeaSeed', IdeaSeed);
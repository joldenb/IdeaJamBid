var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var officegen = require('officegen');
var fs = require('fs');
var ObjectId = mongoose.Schema.Types.ObjectId;

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

	suggestions		: [{
		category		: String,
		contributor		: ObjectId,
		problemType		: String,
		suggestion		: String,
		hindsight		: String,
		outsight		: String,
		foresight		: String,
	}],

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
		if(idea.description){
			pObj.addText( idea.description, {font_size : 14});
		} else {
			pObj.addText( "No idea description entered yet.", {font_size : 14});
		}
		pObj = docx.createP ();
		pObj.addText( '', { font_size : 25 } );
		pObj = docx.createP ();
		pObj.addText( 'Problem It Will Solve', { font_size : 25 } );
		pObj = docx.createP ();
		if(idea.problem){
			pObj.addText( idea.problem, {font_size : 14});
		} else {
			pObj.addText( "No idea problem entered yet.", {font_size : 14});
		}

		docx.putPageBreak ();

		pObj = docx.createP ();
		pObj.addText( 'Value Scores and Problems', { font_size : 25 } );
		
		pObj = docx.createP ();
		var performance = idea.performOne || "No value yet entered";
		pObj.addText( "Performability Rating: " + performance, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( "Performability Problem: " + idea.performProblem, { font_size : 14 } );
		
		pObj = docx.createP ();
		var afford = idea.affordOne || "No value yet entered";
		pObj.addText( "Affordability Rating: " + afford, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( "Affordability Problem: " + idea.affordProblem, { font_size : 14 } );
		
		pObj = docx.createP ();
		var feature = idea.featureOne || "No value yet entered";
		pObj.addText( "Featurability Rating: " + feature, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( "Featurability Problem: " + idea.featureProblem, { font_size : 14 } );
		
		pObj = docx.createP ();
		var deliver = idea.deliverOne || "No value yet entered";
		pObj.addText( "Deliverability Rating: " + deliver, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( "Deliverability Problem: " + idea.deliverProblem, { font_size : 14 } );
		
		pObj = docx.createP ();
		var useability = idea.useabilityOne || "No value yet entered";
		pObj.addText( "Useability Rating: " + useability, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( "Useability Problem: " + idea.useabilityProblem, { font_size : 14 } );
		
		pObj = docx.createP ();
		var maintain = idea.maintainOne || "No value yet entered";
		pObj.addText( "Maintainability Rating: " + maintain, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( "Maintainability Problem: " + idea.maintainProblem, { font_size : 14 } );
		
		pObj = docx.createP ();
		var durable = idea.durabilityOne || "No value yet entered";
		pObj.addText( "Durability Rating: " + durable, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( "Durability Problem: " + idea.durabilityProblem, { font_size : 14 } );
		
		pObj = docx.createP ();
		var image = idea.imageOne || "No value yet entered";
		pObj.addText( "Imageability Rating: " + image, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( "Imageability Problem: " + idea.imageProblem, { font_size : 14 } );

		docx.putPageBreak ();

		pObj = docx.createP ();
		pObj.addText( 'Waste Scores and Problems', { font_size : 25 } );
		
		pObj = docx.createP ();
		var complex = idea.complexOne || "No value yet entered";
		pObj.addText( "Complexity Rating: " + complex, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( "Complexity Problem: " + idea.complexProblem, { font_size : 14 } );

		pObj = docx.createP ();
		var precise = idea.precisionOne || "No value yet entered";
		pObj.addText( "Precision Rating: " + precise, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( "Precision Problem: " + idea.precisionProblem, { font_size : 14 } );

		pObj = docx.createP ();
		var variable = idea.variabilityOne || "No value yet entered";
		pObj.addText( "Variability Rating: " + variable, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( "Variability Problem: " + idea.variabilityProblem, { font_size : 14 } );
		
		pObj = docx.createP ();
		var sensitive = idea.sensitivityOne || "No value yet entered";
		pObj.addText( "Sensitivity Rating: " + sensitive, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( "Sensitivity Problem: " + idea.sensitivityProblem, { font_size : 14 } );

		pObj = docx.createP ();
		var immature = idea.immatureOne || "No value yet entered";
		pObj.addText( "Immaturity Rating: " + immature, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( "Immaturity Problem: " + idea.immatureProblem, { font_size : 14 } );

		pObj = docx.createP ();
		var danger = idea.dangerOne || "No value yet entered";
		pObj.addText( "Danger Rating: " + danger, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( "Danger Problem: " + idea.dangerProblem, { font_size : 14 } );

		pObj = docx.createP ();
		var skills = idea.skillsOne || "No value yet entered";
		pObj.addText( "Skills Required Rating: " + skills, {font_size : 18});
		pObj = docx.createP ();
		pObj.addText( "Skills Required Problem: " + idea.skillsProblem, { font_size : 14 } );

		docx.generate ( res );

};

IdeaSeed.statics.getListOfProblems = function(idea) {
	var problems = [];
	if(idea["performProblem"]){
		problems.push(["Performance", idea["performProblem"] ]);
	}
	if(idea["affordProblem"]){
		problems.push(["Affordability", idea["affordProblem"] ]);	
	}
	if(idea["featureProblem"]){
		problems.push(["Featurability", idea["featureProblem"] ]);
	}
	if(idea["deliverProblem"]){
		problems.push(["Deliverability", idea["deliverProblem"] ]);
	}
	if(idea["useabilityProblem"]){
		problems.push(["Useability", idea["useabilityProblem"] ]);
	}
	if(idea["maintainProblem"]){
		problems.push(["Maintainability", idea["maintainProblem"] ]);
	}
	if(idea["durabilityProblem"]){
		problems.push(["Durability", idea["durabilityProblem"] ]);
	}
	if(idea["imageProblem"]){
		problems.push(["Imageability", idea["imageProblem"] ]);
	}
	if(idea["complexProblem"]){
		problems.push(["Complexity", idea["complexProblem"] ]);
	}
	if(idea["precisionProblem"]){
		problems.push(["Precision", idea["precisionProblem"] ]);
	}
	if(idea["variabilityProblem"]){
		problems.push(["Variability", idea["variabilityProblem"] ]);
	}
	if(idea["sensitivityProblem"]){
		problems.push(["Sensitivity", idea["sensitivityProblem"] ]);
	}
	if(idea["immatureProblem"]){
		problems.push(["Immaturity", idea["immatureProblem"] ]);
	}
	if(idea["dangerProblem"]){
		problems.push(["Danger", idea["dangerProblem"] ]);
	}
	if(idea["skillsProblem"]){
		problems.push(["Skills", idea["skillsProblem"] ]);
	}
	return problems;
};

module.exports = mongoose.model('IdeaSeed', IdeaSeed);
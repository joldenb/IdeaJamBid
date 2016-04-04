var mongoose = require('mongoose');
var _ = require('underscore');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var officegen = require('officegen');
var fs = require('fs');
var ObjectId = mongoose.Schema.Types.ObjectId;

var IdeaSeed = new Schema({
	name			: String,
	description		: String,
	problem			: String,
	images			: [ObjectId],
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


/*
	This method will take an idea and a problem and return an 
	object with keys that are suggestion types (e.g. reduce-parts)
	and values which are arrays of suggestions for that idea with that
	particular suggestion type.
*/
IdeaSeed.statics.getCategorizedSuggestions = function(idea, problem){
	var suggestionList = {},
		problemSuggestions = [];

	_.each(idea["suggestions"], function(element, index, list){
		if(element._doc["problemType"] == problem){
			problemSuggestions.push(element);
		}
	});

	_.each(problemSuggestions, function(element, index, list){
		if(suggestionList.hasOwnProperty(element["category"])){
			suggestionList[element["category"]].push(element._doc);
		} else {
			suggestionList[element["category"]] = [element._doc];
		}
	});

	return suggestionList;
};

/*
	This function is designed to take as an argument the output of the 
	method getCategorizedSuggestions. It's a pretty particular structure.
*/

IdeaSeed.statics.getCategoryPointValues = function(categorizedObject){
	var catPoints = {
		"elim-func" : "+50",
		"elim-parts" : "+50",
		"elim-life" : "+50",
		"elim-mat" : "+50",
		"elim-people" : "+50",

		"reduce-func" : "+50",
		"reduce-parts" : "+50",
		"reduce-life" : "+50",
		"reduce-mat" : "+50",
		"reduce-people" : "+50",

		"sub-func" : "+50",
		"sub-parts" : "+50",
		"sub-life" : "+50",
		"sub-mat" : "+50",
		"sub-people" : "+50",

		"sep-func" : "+50",
		"sep-parts" : "+50",
		"sep-life" : "+50",
		"sep-mat" : "+50",
		"sep-people" : "+50",

		"int-func" : "+50",
		"int-parts" : "+50",
		"int-life" : "+50",
		"int-mat" : "+50",
		"int-people" : "+50",

		"reuse-func" : "+50",
		"reuse-parts" : "+50",
		"reuse-life" : "+50",
		"reuse-mat" : "+50",
		"reuse-people" : "+50",

		"stand-func" : "+50",
		"stand-parts" : "+50",
		"stand-life" : "+50",
		"stand-mat" : "+50",
		"stand-people" : "+50",

		"add-func" : "+50",
		"add-parts" : "+50",
		"add-life" : "+50",
		"add-mat" : "+50",
		"add-people" : "+50"
	};

	for(var category in categorizedObject){
		var points = 50/(Math.pow(2, categorizedObject[category].length));
		points = Math.round(points);
		catPoints[category] = "+" + points;
	}

	return catPoints;
};

IdeaSeed.statics.getCategoryDisplayNames = function(categorizedObject){
	var returnCategories = {};
	for(var cat in categorizedObject){
		switch ( cat ) {
			case "elim-func" :
				returnCategories["Eliminate Functions"] = categorizedObject["elim-func"];
				break;
			case "elim-parts" :
				returnCategories["Eliminate Parts"] = categorizedObject["elim-parts"];
				break;
			case "elim-life" :
				returnCategories["Eliminate Life-Cycle Processes"] = categorizedObject["elim-life"];
				break;
			case "elim-mat" :
				returnCategories["Eliminate Materials"] = categorizedObject["elim-mat"];
				break;
			case "elim-people" :
				returnCategories["Eliminate People"] = categorizedObject["elim-people"];
				break;

			case "reduce-func" :
				returnCategories["Reduce Functions"] = categorizedObject["reduce-func"];
				break;
			case "reduce-parts" :
				returnCategories["Reduce Parts"] = categorizedObject["reduce-parts"];
				break;
			case "reduce-life" :
				returnCategories["Reduce Life-Cycle Processes"] = categorizedObject["reduce-life"];
				break;
			case "reduce-mat" :
				returnCategories["Reduce Materials"] = categorizedObject["reduce-mat"];
				break;
			case "reduce-people" :
				returnCategories["Reduce People"] = categorizedObject["reduce-people"];
				break;

			case "sub-func" :
				returnCategories["Substitute Functions"] = categorizedObject["sub-func"];
				break;
			case "sub-parts" :
				returnCategories["Substitute Parts"] = categorizedObject["sub-parts"];
				break;
			case "sub-life" :
				returnCategories["Substitute Life-Cycle Processes"] = categorizedObject["sub-life"];
				break;
			case "sub-mat" :
				returnCategories["Substitute Materials"] = categorizedObject["sub-mat"];
				break;
			case "sub-people" :
				returnCategories["Substitute People"] = categorizedObject["sub-people"];
				break;


			case "sep-func" :
				returnCategories["Separate Functions"] = categorizedObject["sep-func"];
				break;
			case "sep-parts" :
				returnCategories["Separate Parts"] = categorizedObject["sep-parts"];
				break;
			case "sep-life" :
				returnCategories["Separate Life-Cycle Processes"] = categorizedObject["sep-life"];
				break;
			case "sep-mat" :
				returnCategories["Separate Materials"] = categorizedObject["sep-mat"];
				break;
			case "sep-people" :
				returnCategories["Separate People"] = categorizedObject["sep-people"];
				break;


			case "int-func" :
				returnCategories["Integrate Functions"] = categorizedObject["int-func"];
				break;
			case "int-parts" :
				returnCategories["Integrate Parts"] = categorizedObject["int-parts"];
				break;
			case "int-life" :
				returnCategories["Integrate Life-Cycle Processes"] = categorizedObject["int-life"];
				break;
			case "int-mat" :
				returnCategories["Integrate Materials"] = categorizedObject["int-mat"];
				break;
			case "int-people" :
				returnCategories["Integrate People"] = categorizedObject["int-people"];
				break;

			case "reuse-func" :
				returnCategories["Re-Use Functions"] = categorizedObject["reuse-func"];
				break;
			case "reuse-parts" :
				returnCategories["Re-Use Parts"] = categorizedObject["reuse-parts"];
				break;
			case "reuse-life" :
				returnCategories["Re-Use Life-Cycle Processes"] = categorizedObject["reuse-life"];
				break;
			case "reuse-mat" :
				returnCategories["Re-Use Materials"] = categorizedObject["reuse-mat"];
				break;
			case "reuse-people" :
				returnCategories["Re-Use People"] = categorizedObject["reuse-people"];
				break;


			case "stand-func" :
				returnCategories["Standardize Functions"] = categorizedObject["stand-func"];
				break;
			case "stand-parts" :
				returnCategories["Standardize Parts"] = categorizedObject["stand-parts"];
				break;
			case "stand-life" :
				returnCategories["Standardize Life-Cycle Processes"] = categorizedObject["stand-life"];
				break;
			case "stand-mat" :
				returnCategories["Standardize Materials"] = categorizedObject["stand-mat"];
				break;
			case "stand-people" :
				returnCategories["Standardize People"] = categorizedObject["stand-people"];
				break;

			case "add-func" :
				returnCategories["Add Functions"] = categorizedObject["add-func"];
				break;
			case "add-parts" :
				returnCategories["Add Parts"] = categorizedObject["add-parts"];
				break;
			case "add-life" :
				returnCategories["Add Life-Cycle Processes"] = categorizedObject["add-life"];
				break;
			case "add-mat" :
				returnCategories["Add Materials"] = categorizedObject["add-mat"];
				break;
			case "add-people" :
				returnCategories["Add People"] = categorizedObject["add-people"];
				break;
		}
	}
	return returnCategories;
};

module.exports = mongoose.model('IdeaSeed', IdeaSeed);
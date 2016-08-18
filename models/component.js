var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var Component = new Schema({
	text				: String,	 // this is optional
	descriptions : [ String ], // must have at least one

	hindsight	: String,
	outsight	: String,
	foresight	: String,
	number		: Number,
	date : Date,
	identifier	: String, //unique public facing identifier, of the form comp-(date.now)
	
	category	: String,  // the column and row of the component - suggestion
	
	creator			: String, //should match the username field of an account
	problemID		: ObjectId, 

	images			: [{
		imageID		: ObjectId,
		firstX		: String,
		firstY		: String,
		secondX		: String,
		secondY		: String
	}],

	mainImage		: ObjectId,

	//should get saved in both components,
	// with each other's object ID's
	relatedComps : [{
		compID				: ObjectId,
		relationship	: String 
	}],

	ideaSeed		: ObjectId,
  upvotes      : [ObjectId],

}, { autoIndex: false });

/*
	This function is designed to take as an argument the output of the 
	method getCategorizedSuggestions. It's a pretty particular structure.
*/

Component.statics.getCategoryPointValues = function(categorizedObject){
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


module.exports = mongoose.model('Component', Component);
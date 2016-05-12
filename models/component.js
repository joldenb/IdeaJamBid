var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var Component = new Schema({
	text				: String,
	descriptions : [String],
	creator			: String, //should match the username field of an account
	number			: Number,

	images			: [{
		imageID		: ObjectId,
		firstX		: String,
		firstY		: String,
		secondX		: String,
		secondY		: String
	}],

	ideaSeed		: ObjectId
});


Component.plugin(passportLocalMongoose);

module.exports = mongoose.model('Component', Component);
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var IdeaProblem = new Schema({
	text				: String,
	creator			: String, //should match the username field of an account
	priority		: Number,
	problemArea	: String,

	ideaSeed		: ObjectId
});

module.exports = mongoose.model('IdeaProblem', IdeaProblem);
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var IdeaProblem = new Schema({
	text				: String,
	creator			: String, //should match the username field of an account
	priority		: Number,
	date				: Date,
	problemArea	: String,

  identifier  : String, //unique public facing identifier, of the form prob-(date.now)

	ideaSeed		: ObjectId,
  upvotes      : [ObjectId],

}, { autoIndex: false });

module.exports = mongoose.model('IdeaProblem', IdeaProblem);
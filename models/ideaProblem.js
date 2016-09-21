var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;
var autopopulate = require('mongoose-autopopulate');

var IdeaProblem = new Schema({
	text				: String,
	creator			: String, //should match the username field of an account
	priority		: Number,
	date				: Date,
	problemArea	: String,

  identifier  : String, //unique public facing identifier, of the form prob-(date.now)

	ideaSeed		: [{type: Schema.Types.ObjectId, ref: 'IdeaSeed', autopopulate: true }],
  upvotes      : [[{type: Schema.Types.ObjectId, ref: 'Account', autopopulate: true }]],

}, { autoIndex: false });

IdeaProblem.plugin(autopopulate);

module.exports = mongoose.model('IdeaProblem', IdeaProblem);
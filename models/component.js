var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var Component = new Schema({
	text				: String,
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
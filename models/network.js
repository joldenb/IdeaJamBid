var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var Network = new Schema({
	name : String,
	profilePic : String,
	description : String,
	visibility		: { type: String, default: "private" },
	type : String, //either school, company, or city/state
	admins : [ObjectId],
	invitedMembers : [String] // emails of people who were sent email invitations
}, { autoIndex: false });

module.exports = mongoose.model('Network', Network);
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var Network = new Schema({
	name : String,
	profilePic : String,
	description : String,
	type : String //either school, company, or city/state
}, { autoIndex: false });



module.exports = mongoose.model('Network', Network);
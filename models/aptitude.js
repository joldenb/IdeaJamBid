var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var Aptitude = new Schema({
	title : String,
	identifier : String, //either school, company, or city/state
	admins : [ObjectId]
}, { autoIndex: false });



module.exports = mongoose.model('Aptitude', Aptitude);
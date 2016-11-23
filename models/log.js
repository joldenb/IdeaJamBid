var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var Log = new Schema({
    text : String,
    type : String, //either membership, idea-seed, created-account, made-suggestion, einstein-points
    user : ObjectId,
    membershipID : ObjectId,
    date : Date,
    relevantLink : String,
    ideaSeedID : ObjectId

}, { autoIndex: false });

module.exports = mongoose.model('Log', Log);
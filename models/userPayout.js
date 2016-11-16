var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserPayout = new Schema({
	amount: Number, //amount in cents
	campaign: {type: Schema.Types.ObjectId, ref: 'Campaign', autopopulate: true },
	dateSent: Date
}, { autoIndex: false });

module.exports = mongoose.model('UserPayout', UserPayout);
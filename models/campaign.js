var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Campaign = new Schema({
	payments : [{type: Schema.Types.ObjectId, ref: 'CampaignPayment'}],
	prizes: [{type: Schema.Types.ObjectId, ref: 'CampaignPrize'}],
	goal: Number, //amount in dollars
	state: String
}, { autoIndex: false });

module.exports = mongoose.model('Campaign', Campaign);
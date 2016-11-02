var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CampaignPayment = new Schema({
	username: String,
	stripeCustomerId: String,
	amount: Number, //amount in cents
	prize: {type: Schema.Types.ObjectId, ref: 'CampaignPrize'},
}, { autoIndex: false });

module.exports = mongoose.model('CampaignPayment', CampaignPayment);
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CampaignPayment = new Schema({
	username: String,
	stripeCustomerId: String,
	amount: Number //amount in cents
}, { autoIndex: false });

module.exports = mongoose.model('CampaignPayment', CampaignPayment);
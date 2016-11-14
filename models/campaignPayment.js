var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CampaignPayment = new Schema({
	username: String,
	stripeCustomerId: String,
	amount: Number, //amount in cents
  collectedAppAmt: Number, //amount collected post stripe fee for the application
	prize: {type: Schema.Types.ObjectId, ref: 'CampaignPrize'},
	chargeId: String,
  feeBalTxn: String,
	state: { type:String, enum: ['captured', 'charged', 'failed', 'funds_available'] },
	chargedOnDate: Date
}, { autoIndex: false });

module.exports = mongoose.model('CampaignPayment', CampaignPayment);
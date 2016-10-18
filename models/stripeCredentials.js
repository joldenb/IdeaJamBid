var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var StripeCredentials = new Schema({
	"token_type": String,
	"stripe_publishable_key": String,
	"scope": String,
	"livemode": Boolean,
	"stripe_user_id": String,
	"refresh_token": String,
	"access_token": String
}, { autoIndex: false });

module.exports = mongoose.model('StripeCredentials', StripeCredentials);
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CampaignPrize = new Schema({
	name: String,
	description: String,
	cost: Number, //amount in dollars
	imageUrl: String
}, { autoIndex: false });

module.exports = mongoose.model('CampaignPrize', CampaignPrize);
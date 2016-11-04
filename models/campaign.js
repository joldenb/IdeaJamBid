var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

var Campaign = new Schema({
  variant: String, //unique name of the variant
	payments : [{type: Schema.Types.ObjectId, ref: 'CampaignPayment'}],
	prizes: [{type: Schema.Types.ObjectId, ref: 'CampaignPrize'}],
	goal: Number, //amount in dollars
	state: String,
  startDate: Date,
  endDate: Date
}, { autoIndex: false });

Campaign.methods.timeRemaining = function() {
  if(this.state !== 'open') {
    throw new Error('Campaign is not currently running!');
  }
  var endMoment = moment(this.endDate);
  var remainingDuration = moment.duration(endMoment - moment());
  if(remainingDuration.asDays() >= 2) {
    return {time: Math.trunc(remainingDuration.asDays()), units: 'days'}
  } else if(remainingDuration.asHours() >= 2) {
    return {time: Math.trunc(remainingDuration.asHours()), units: 'hours'}
  } else if(remainingDuration.asMinutes() > 5) {
    return {time: Math.trunc(remainingDuration.asMinutes()), units: 'minutes'}
  } else {
    return {time: Math.trunc(remainingDuration.asSeconds()), units: 'seconds'}
  }
};

module.exports = mongoose.model('Campaign', Campaign);
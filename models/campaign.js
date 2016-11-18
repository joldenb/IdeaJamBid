var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');
const steps = ['Backer Payment Processing', 'Funding Sent to Inventor', 'Contributor Payouts Sent'];


var Campaign = new Schema({
  variant: String, //unique name of the variant
	payments : [{type: Schema.Types.ObjectId, ref: 'CampaignPayment'}],
	prizes: [{type: Schema.Types.ObjectId, ref: 'CampaignPrize'}],
	goal: Number, //amount in dollars
	state: { type:String, enum: ['open', 'processing_payments', 'funded', 'processing_payouts', 'closed', 'unsuccessful'] },
  startDate: Date,
  endDate: Date,
  startProcessingDate: Date,
  startPayoutDate: Date,
  goalReached: Boolean
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

Campaign.methods.endDateShort = function() {
  let endMoment = moment(this.endDate);
  return endMoment.format("l");
};

Campaign.methods.completedSteps = function() {
  if(this.state === 'open' || this.state === 'unsuccessful' || this.state === 'processing_payments') {
    return [];
  }
  if(this.state === 'funded' || this.state  === 'processing_payouts') {
    return steps.slice(0, 2);
  }
  if(this.state === 'closed') {
    return steps;
  }
};

Campaign.methods.uncompletedSteps = function() {
  if(this.state === 'closed' || this.state === 'unsuccessful') {
    return [];
  }
  if(this.state === 'open' || this.state === 'processing_payments') {
    return steps;
  }
  if(this.state === 'funded' || this.state  === 'processing_payouts') {
    return steps.slice(2, 4);
  }
};

module.exports = mongoose.model('Campaign', Campaign);
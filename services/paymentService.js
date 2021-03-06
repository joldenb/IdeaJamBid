var exports = module.exports = {};
var paypal = require('paypal-rest-sdk');
var moment = require('moment');
var CampaignPayment = require('../models/campaignPayment');
var _ = require('underscore');

exports.contributorPaymentPercent = function(contributions, totalContributors) {
  return Math.floor((contributions/totalContributors)/10 * 10000)/100
};

function contributorPaymentAmount(contributorsTotalPoolAmount, contributions, totalContributors) {
  //Round down, for instance 2000 total payment and 3 contributors will give payment of 666.66
  return Math.floor(((contributorsTotalPoolAmount/totalContributors) * contributions * 1000)/10)/100;
}
exports.contributorPaymentAmount = contributorPaymentAmount;

function buildPaypalPayContributors(contributorsWithCounts, totalPayment) {
  var sender_batch_id = moment.now();

  var payout = {
    'sender_batch_header': {
      "sender_batch_id": sender_batch_id,
      "email_subject": "IdeaJam payment"
    }
  };
  var totalContributions = _.reduce(_.values(contributorsWithCounts), function(sum, val) { return sum+val}, 0);

  var paymentItems = _.map(contributorsWithCounts, function(contributions, contributor) {
    let payment = contributorPaymentAmount(totalPayment, contributions, totalContributions);
    return {
      "recipient_type":  "EMAIL",
      "amount": {
        "value": payment,
        "currency": "USD"
      },
      "receiver": contributor,
      "note": "Thank you."
      // Do not actually need a sender item id, might be useful but need a sub-30 character id. Not implementing for now.
      // "sender_item_id": contributor  //docs say: A sender-specified ID number. Tracks the batch payout in an accounting system. Max len 30.
    };
  });

  payout.items = paymentItems;

  return payout;
}

exports._paypalPayContributors = function(data) {
  paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AR55GTcvFeDRHrRcYGLRHu_O4ya7I8TYecpOhig8s4hRE7Lu1-1OilxNpfhRdT45Wq0Z-hANLt0YGm_M',
    'client_secret': process.env.PAYPAL_SECRET
  });

  var jsonData = JSON.stringify(data);
  console.log('Sending JSON: ' + jsonData);
  paypal.payout.create(jsonData, function (error, payout) {
    if (error) {
      console.log(error.response);
      throw error;
    } else {
      console.log("Create Payout Response");
      console.log(payout);
      return true;
    }
  });
};

exports.payContributors = function(contributorsWithCounts, totalContribPayment) {
  var paypalMap = buildPaypalPayContributors(contributorsWithCounts, totalContribPayment);
  this._paypalPayContributors(paypalMap);
  return _.map(paypalMap.items, function(item) {
    return {username: item.receiver, amount: item.amount.value};
  })
};

function sumPayments(campaign) {
  return CampaignPayment.aggregate([
    {$match: {'_id': {$in: campaign.payments}}},
    {$group: {'_id': null, total: {$sum: '$amount'}}}
  ]).exec().then(function(result) {
    if(result.length === 0) {
      return 0;
    } else {
      return result[0].total;
    }
  });
}
exports.sumPayments = sumPayments;


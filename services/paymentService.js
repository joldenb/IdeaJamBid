var exports = module.exports = {};
var paypal = require('paypal-rest-sdk');
var moment = require('moment');

exports.contributorPaymentPercent = function(contributions, totalContributors) {
  return Math.floor((contributions/totalContributors)/10 * 10000)/100
};

function contributorPaymentAmount(contributorsTotalPoolAmount, contributions, totalContributors) {
  //Round down, for instance 2000 total payment and 3 contributors will give payment of 666.66
  return Math.floor(((contributorsTotalPoolAmount/totalContributors) * contributions * 1000)/10)/100;
}
exports.contributorPaymentAmount = contributorPaymentAmount;

function ContributorPortionOfTotal(total) {

};

function buildPaypalPayContributors(contributors, totalPayment) {
  var sender_batch_id = moment.now();

  var payout = {
    'sender_batch_header': {
      "sender_batch_id": sender_batch_id,
      "email_subject": "IdeaJam payment"
    }
  };

  //Round down, for instance 2000 total payment and 3 contributors will give payment of 666.66
  payment = contributorPaymentAmount(totalPayment, 1, contributors.length);

  var paymentItems = contributors.map(function(contributor) {
    return {
      "recipient_type":  "EMAIL",
      "amount": {
        "value": payment,
        "currency": "USD"
      },
      "receiver": contributor,
      "note": "Thank you.",
      "sender_item_id": contributor  //docs say: A sender-specified ID number. Tracks the batch payout in an accounting system.
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

//TODO: this function needs to compute the amount to pay for each contributor in the future
exports.payContributors = function(contributors, ideaName) {
  var paypalMap = buildPaypalPayContributors(contributors, 3000);
  return this._paypalPayContributors(paypalMap);
};


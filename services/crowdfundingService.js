var exports = module.exports = {};
var IdeaSeed = require('../models/ideaSeed');
var Campaign = require('../models/campaign');
var CampaignPrize = require('../models/campaignPrize');
var moment = require('moment');
var paypal = require('paypal-rest-sdk');

function buildPaypalPayContributors(contributors, totalPayment) {
  var sender_batch_id = moment.now();

  var payout = {
    'sender_batch_header': {
      "sender_batch_id": sender_batch_id,
      "email_subject": "IdeaJam payment"
    }
  };

  //Round down, for instance 2000 total payment and 3 contributors will give payment of 666.66
  payment = Math.floor(((totalPayment/contributors.length) * 1000)/10)/100;

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

exports.createCampaign = function(campaignData, account, ideaName) {
  return IdeaSeed.findOne({name: ideaName}).then(function(ideaSeed) {
    var prizeValues = Object.keys(campaignData)
      .filter(function(key) { 
        return key.startsWith('prizeName') 
      })
      .map(function(key) { 
        return key.substring(9) 
      });

    var prizeIds = prizeValues.map(function(val) {
      var prize = new CampaignPrize({
        name: campaignData['prizeName' + val],
        description: campaignData['prizeDesc' + val],
        cost: campaignData['prizeCost' + val], //amount in dollars
        imageUrl: campaignData['prizeImageUrl' + val]});
      prize.save();
      return prize.id;
    });

    var campaign = new Campaign({
      goal: campaignData.goal,
      prizes: prizeIds,
      state: 'open'
    });
    campaign.save();

    ideaSeed.campaigns.push(campaign.id);
    return ideaSeed.save().then(function() {
      return campaign;
    })
  });
};

//TODO: this function needs to compute the amount to pay for each contributor in the future
exports.payContributors = function(contributors, ideaName) {
  var paypalMap = buildPaypalPayContributors(contributors, 3000);
  return this._paypalPayContributors(paypalMap);
};

exports.getOpenCampaign = function(ideaSeed) {
  var openCampaigns = ideaSeed.campaigns.filter(function(campaign) { return campaign.state === 'open' });
  if(openCampaigns.length > 1) {
    console.log("Found multiple open campaigns for the idea: " + ideaSeed.name);
    throw new Error("Found multiple open campaigns for the idea: " + ideaSeed.name);
    return undefined;
  } else if(openCampaigns.length < 1) {
    return undefined;
  }
  return openCampaigns[0];
};
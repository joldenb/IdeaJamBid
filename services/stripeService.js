var exports = module.exports = {};
var requestpromise = require('request-promise');
var CrowdfundingService = require('./crowdfundingService');
var Account = require('../models/account');
var IdeaSeed = require('../models/ideaSeed');
var StripeCredentials = require('../models/stripeCredentials');
var CampaignPayment = require('../models/campaignPayment');
var Promise = require('bluebird');

const TOKEN_URI = 'https://connect.stripe.com/oauth/token';

// Set your secret key: remember to change this to your live secret key in production
// See your keys here: https://dashboard.stripe.com/account/apikeys
var stripe = require("stripe").Stripe(process.env.STRIPE_SECRET);

function campaignCharge(customerId, amount, idea, hostAccount) {
  var application_fee = Math.round(amount * 0.2);

  try {
    return stripe.charges.create({
      amount: amount, // Amount in cents
      currency: "usd",
      customer: customerId,
      destination: hostAccount.stripeCredentials.stripe_user_id,
      application_fee: application_fee,
      description: "Funding idea: " + idea.name
    }).then(function () {
      console.log('Successfully charged the card for customer ' + customerId);
      return true;
    }, function (err) {
      if (err && err.type === 'StripeCardError') {
        console.error('Could not process the payment: ', err);
        return false;
      }
    });
  } catch (error) {
    console.log(error);
    return false;
  }
}

exports.basicCharge = function(tokenId, amount) {
  return stripe.charges.create({
    amount: amount, // Amount in cents
    currency: "usd",
    source: tokenId,
    description: "Example charge"
  }).then(function() {
    console.log('Successfully charged the card!');
    return true;
  }, function(err) {
    if (err && err.type === 'StripeCardError') {
      console.error('Could not process the payment: ', err);
      return false;
    }
  });
};

exports.delayedChargeCreation = function(tokenId, amount, prizeId, user, ideaName) {
  console.log("Creating payment for amount " + amount + " and prizeId " + prizeId);
  var ideaQuery = IdeaSeed.findOne({"name" : ideaName}).exec();
  var createCustomerReq = stripe.customers.create({
    source: tokenId,
    description: user.username
  });

  return Promise.all([ideaQuery, createCustomerReq]).then(function(values) {
    var idea = values[0];
    var stripeCustomer = values[1];

    if (idea === undefined) {
      throw new Error("Can't find idea with name: " + ideaName);
    }

    var campaign = CrowdfundingService.getOpenCampaign(idea);
    if(campaign === undefined) {
      console.error('Could not find an open campaign to create future payment for with ideaName ' + ideaName);
      throw new Error('Could not find an open campaign to create future payment for');
    }

    var campaignPayment = new CampaignPayment({
      username: user.username,
      stripeCustomerId: stripeCustomer.id,
      amount: amount,
      prize: prizeId
    });
    return campaignPayment.save().then(function (campaignPayment) {
      campaign.payments.push(campaignPayment.id);
      return campaign.save().then(function() {
        return true;
      })
    });
  });
};

exports.fundCampaign = function(ideaName) {
  return IdeaSeed.findOne({"name" : ideaName}).then(function (idea){
    return Account.findOne({'username': idea.inventorName}).then(function (account) {
      var campaign = CrowdfundingService.getOpenCampaign(idea);
      if(campaign === undefined) {
        console.error('Could not find an open campaign to fund for ideaName ' + ideaName);
        throw new Error('Could not find an open campaign to fund');
      }
      campaign.populate('payments.campaignpayment');
      return CampaignPayment.find({'_id': {$in: campaign.payments}}).exec().then(function (payments) {
        var charges = payments.map(function(campaignPayment) {
          return campaignCharge(campaignPayment.stripeCustomerId, campaignPayment.amount, idea, account);
        });
        return Promise.all(charges);
      });
    });
  });
};

exports.connect = function(stripeInfo, user) {
  var query = Account.findById( user.id);
  var authPost = requestpromise({
    method: 'POST',
    url: TOKEN_URI,
    form: {
      grant_type: "authorization_code",
      client_id: process.env.STRIPE_CLIENT_ID,
      code: stripeInfo.code,
      client_secret: process.env.STRIPE_SECRET
    }
  });

  return Promise.all([query, authPost]).then(function(values) {
    var account = values[0];
    var postResponse = values[1];

    if(!account){
      console.error("When connecting accounts can't find user with username: " + account.username)
      throw new Error("Can't find user with username: " + account.username);
    }

    var stripeParsed = JSON.parse(postResponse);
    var stripeCreds = new StripeCredentials(stripeParsed);
    stripeCreds.save();
    account.stripeCredentials = stripeCreds._id;
    return account.save().then(function() {
      if(stripeInfo.state) {
        var stateParts = stripeInfo.state.split(',');
        return stateParts[0];
      }
      console.error('After connecting accounts failed to get state info');
      return null;
    });
  });
};
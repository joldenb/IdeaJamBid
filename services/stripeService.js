var exports = module.exports = {};
var requestpromise = require('request-promise');
var CrowdfundingService = require('./crowdfundingService');
const EmailService = require('./emailService');
var Account = require('../models/account');
var IdeaSeed = require('../models/ideaSeed');
var StripeCredentials = require('../models/stripeCredentials');
var CampaignPayment = require('../models/campaignPayment');
var Promise = require('bluebird');

const TOKEN_URI = 'https://connect.stripe.com/oauth/token';

// Set your secret key: remember to change this to your live secret key in production
// See your keys here: https://dashboard.stripe.com/account/apikeys
var stripe = require("stripe").Stripe(process.env.STRIPE_SECRET);

function campaignCharge(customerId, amount, idea, hostAccount, hasContributors) {
  let amountInCents = amount * 100;
  var stripeFeeInCents = (amountInCents *.029) + 30;
  //Stripe fee comes out of application_fee
  var applicationFee;
  if(hasContributors === false) {
    applicationFee = Math.round(amountInCents * 0.1 + stripeFeeInCents);
  } else {
    applicationFee = Math.round(amountInCents * 0.2 + stripeFeeInCents);
  }


  try {
    return stripe.charges.create({
      amount: amountInCents, // Amount in cents
      currency: "usd",
      customer: customerId,
      destination: hostAccount.stripeCredentials.stripe_user_id,
      application_fee: applicationFee,
      description: "Funding idea: " + idea.name
    }).then(function (json) {
      return json;
    }, function (err) {
      console.error('Could not process the payment: ', err);
      return {status: 'failed'};
    });
  } catch (error) {
    console.error(error);
    return {status: 'failed'};
  }
}

exports.basicCharge = function(tokenId, amount) {
  return stripe.charges.create({
    amount: amount, // Amount in cents
    currency: "usd",
    source: tokenId,
    description: "Example charge"
  }).then(function() {
    return true;
  }, function(err) {
    console.error('Could not process the payment: ', err);
    return false;
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
        //We don't return the next two calls so we won't block waiting on them
        EmailService.sendPledgeConfirmation(campaignPayment, idea, user);
        CrowdfundingService.checkCampaignFunding(idea, campaign);
        return campaignPayment;
      })
    });
  });
};

exports.fundCampaign = function(campaign, idea, hasContributors) {
  var inventorAccount;
  return Account.findOne({'username': idea.inventorName}).then(function (account) {
    inventorAccount = account;
    return CampaignPayment.find({'_id': {$in: campaign.payments}}).exec()
  }).then(function (payments) {
    var charges = payments.map(function(campaignPayment) {
      try {
        return campaignCharge(campaignPayment.stripeCustomerId, campaignPayment.amount, idea, inventorAccount, hasContributors).then(function(result) {
          if(result.id) {
            EmailService.sendCardCharged(campaignPayment.username, idea, campaignPayment);
            campaignPayment.chargeId = result.id;
            campaignPayment.state = 'charged';
          } else {
            campaignPayment.state = 'failed';
            console.error('Charging the credit card for ' + idea.name + ' campaignPayment failed: ' + campaignPayment);
          }
          return campaignPayment.save();
        }).then(function(payment) {
          return payment;
        }, function (err) {
          console.error(err);
        });
      } catch (error) {
        console.error(error);
        return;
      }

    });
    return Promise.all(charges);
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
      console.error("When connecting accounts can't find user with username: " + account.username);
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

//To inject a mock use this method
exports._setStripe = function(stripeObj) {
  stripe = stripeObj;
};
var exports = module.exports = {};
var requestpromise = require('request-promise');
var Account = require('../models/account');
var IdeaSeed = require('../models/ideaSeed');
var StripeCredentials = require('../models/stripeCredentials');
var Promise = require('bluebird');

const TOKEN_URI = 'https://connect.stripe.com/oauth/token';

// Set your secret key: remember to change this to your live secret key in production
// See your keys here: https://dashboard.stripe.com/account/apikeys
// TODO: Use a variable
var stripe = require("stripe")("sk_test_dxHWhv5U1LCrruTtDLCGuap4");

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

exports.campaignCharge = function(tokenId, amount, ideaName) {
  var application_fee = Math.round(amount * 0.2);

  var query = IdeaSeed.findOne({"name" : ideaName});
  return query.exec().then(function(idea){
    return Account.findOne({"username" : idea.inventorName}).exec().then(function(account) {
      return stripe.charges.create({
        amount: amount, // Amount in cents
        currency: "usd",
        source: tokenId,
        destination: account.stripeCredentials.stripe_user_id,
        application_fee: application_fee,
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
      return null;
    });
  });
};
var exports = module.exports = {};
var requestpromise = require('request-promise');
var Account = require('../models/account');
var StripeCredentials = require('../models/stripeCredentials');

const TOKEN_URI = 'https://connect.stripe.com/oauth/token';

// Set your secret key: remember to change this to your live secret key in production
// See your keys here: https://dashboard.stripe.com/account/apikeys
// TODO: Use a variable
var stripe = require("stripe")("sk_test_dxHWhv5U1LCrruTtDLCGuap4");

exports.charge = function(tokenId, amount) {
  console.log('Creating charge for amount ' + amount + ' and source: ', tokenId);
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

exports.connect = function(stripeInfo, user) {
  return requestpromise({
    method: 'POST',
    url: TOKEN_URI,
    form: {
      grant_type: "authorization_code",
      client_id: process.env.STRIPE_CLIENT_ID,
      code: stripeInfo.code,
      client_secret: process.env.STRIPE_SECRET
    }
  }).then(function(r) {
    Account.findById( user.id, function (err, account) {
      if(err) {
        throw err;
      }
      if(!account){
        throw new Error("Can't find user with username: " + account.username);
      }

      var stripeParsed = JSON.parse(r);
      account.stripeCredentials = new StripeCredentials(stripeParsed);
      account.save(function (err) {
        if(err) {
          throw err;
        }
        return account;
      });
    });
  })
};
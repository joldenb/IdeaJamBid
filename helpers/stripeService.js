var exports = module.exports = {};

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
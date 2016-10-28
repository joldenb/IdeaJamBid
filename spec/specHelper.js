var exports = module.exports = {};
var Account = require('../models/account');
var IdeaSeed = require('../models/ideaSeed');
var StripeCredentials = require('../models/stripeCredentials');

exports.createOrFindTestAccount = function(username, cb) {
  Account.findOne({ 'username' : username  }, function(user) {
    if(user){
      return user;
    }

    var stripeCreds = new StripeCredentials({
      "token_type": "bearer",
      "stripe_publishable_key": "pk_test_123",
      "scope": "read_write",
      "livemode": false,
      "stripe_user_id": "acct_123",
      "refresh_token": "rt_123",
      "access_token":  "sk_test_123"
    });

    stripeCreds.save();

    var newAccount = new Account({
      firstname : 'test',
      lastname : 'user',
      nickname : 'testuser',
      username : username,
      einsteinPoints: 0,
      rupees: 0,
      ideaSeeds: [],
      stripeCredentials: stripeCreds._id
    });

    newAccount.setPassword('testpass', function(err, user) {
      user.save();
      cb(user);
    });

    // Account.register(newAccount, 'testpass', function(err, account) {
    //   if (err) {
    //     console.log("err.message:" + err.message);
    //     return null;
    //   }
    //   console.log('Register finished with ' + account.username);
    //   return user;
    // });
  });
};

exports.createOrFindIdeaSeed = function(account, ideaName, visibility) {

  return IdeaSeed.findOne({inventorName: account.username, name: ideaName}).exec().then(function (ideaSeed) {
    if(ideaSeed) {
      return ideaSeed;
    }

    var newIdea = new IdeaSeed({inventorName: account.username,
      name: ideaName,
      visibility : visibility,
      problem: 'test',
      description: 'testdesc'});
    newIdea.save();
    Account.update(
      { _id : account.id },
      { $push : { ideaSeeds : newIdea }},
      function(err, raw){
        console.log('The raw response from Mongo was ', raw);
      }
    );
    return newIdea;
  });
};
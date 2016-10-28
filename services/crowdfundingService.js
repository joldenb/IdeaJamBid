var exports = module.exports = {};
var requestpromise = require('request-promise');
var IdeaSeed = require('../models/ideaSeed');
var Campaign = require('../models/campaign');
var CampaignPrize = require('../models/campaignPrize');
var CampaignPayment = require('../models/campaignPayment');
var Promise = require('bluebird');

exports.createCampaign = function(campaignData, account, ideaName) {
  return IdeaSeed.findOne({name: ideaName}).then(function(ideaSeed) {
    var prizeValues = Object.keys(campaignData)
      .filter(function(key) { return key.startsWith('prizeName') })
      .map(function(key) { return key.substring(9) });

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
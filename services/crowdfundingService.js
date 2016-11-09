var exports = module.exports = {};
var IdeaSeed = require('../models/ideaSeed');
var Campaign = require('../models/campaign');
var CampaignPrize = require('../models/campaignPrize');
var CampaignPayment = require('../models/campaignPayment');
var IdeaProblem = require('../models/ideaProblem');
var Component = require('../models/component');
var EmailService = require('./emailService');
var StripeService = require('./stripeService');
var moment = require('moment');
var _ = require('underscore');

const CAMPAIGN_DURATION_VALUE = 60;
const CAMPAING_DURATION_UNITS = 'days';

exports.createCampaign = function(campaignData, account, ideaName) {
  return IdeaSeed.findOne({name: ideaName}).then(function(ideaSeed) {
    var prizeValues = Object.keys(campaignData)
      .filter(function(key) { 
        return key.startsWith('prizeName') 
      })
      .map(function(key) { 
        return key.substring(9) 
      });

    var prizeIdPromises = prizeValues.map(function(val) {
      var prize = new CampaignPrize({
        name: campaignData['prizeName' + val],
        description: campaignData['prizeDesc' + val],
        cost: campaignData['prizeCost' + val], //amount in dollars
        imageUrl: campaignData['prizeImageUrl' + val]});
      return prize.save().then(function(prize) {
        return prize.id;
      });
    });

    return Promise.all(prizeIdPromises).then(function(prizeIds) {
      //Campaigns should end on 5 minute boundaries to make post-processing easier (we just have to check every 5 minutes)
      var endDate = moment(Math.ceil((new Date())/(moment.duration(5, 'minutes'))) * (moment.duration(5, 'minutes')))
        .add(CAMPAIGN_DURATION_VALUE, CAMPAING_DURATION_UNITS)
        .toDate();
      var campaign = new Campaign({
        goal: campaignData.goal,
        prizes: prizeIds,
        state: 'open',
        startDate: new Date(),
        endDate: endDate
      });
      if(campaignData.variant !== undefined && campaignData.variant !== 'none') {
        campaign.variant = campaignData.variant;
      }
      return campaign.save().then(function(campaign) {
        ideaSeed.campaigns.push(campaign._id);
        return ideaSeed.save().then(function() {
          return campaign;
        })
      });
    });
  });
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

function ideaSeedComponents(idea) {
  return Component.find({"ideaSeed": idea._id}).exec();
}

function getComponents(campaign, idea) {
  if(campaign.variant !== undefined) {
    let selectedVariant = idea.variants.filter(function(variant) {
      return variant.name === campaign.variant
    });
    return Component.find({'_id': {$in: selectedVariant[0].components}}).exec();
  } else {
    return ideaSeedComponents(idea);
  }
}
exports.getComponents = getComponents;

function getContributorUsernames(campaign, idea) {
  return getComponents(campaign, idea).then(function (components) {
    return components.map(function(component) {
      return component.creator;
    })
  });
}

function hasCampaignReachedGoal(campaign) {
  return sumPayments(campaign).then(function(sum) {
    return (sum >= campaign.goal ? true : false);
  });

}

exports.checkCampaignFunding = function(idea, campaign) {
  if(campaign.goalReached) {
    return Promise.resolve(true);
  } else {
    return hasCampaignReachedGoal(campaign).then(function(goalReached) {
      if(goalReached) {
        campaign.goalReached = true;
        campaign.save();
        return getContributorUsernames(campaign, idea).then(function(usernames) {
          var usernamesWithCounts = _.countBy(usernames);
          EmailService.sendGoalReachedContributorEmails(usernamesWithCounts, idea, campaign);
          return true;
        });
      }
      return false;
    });
  }
};

function fetchCampaignsToProcess() {
  return Campaign.find({endDate: {"$lte": new Date()}}).exec();
}

function processCampaignClosing(campaign) {
  campaign.startProcessingDate = new Date();
  campaign.state = 'processing_payments';
  return campaign.save().then(function(campaign) {
    return hasCampaignReachedGoal(campaign);
  }).then(function(reachedGoal){
    return IdeaSeed.findOne({campaigns: campaign._id}).then(function(idea) {
      if (reachedGoal) {
        try {
          return getContributorUsernames(campaign, idea).then(function(usernames) {
            var hasContributors = true;
            if(usernames.length !== 0) {
              var uniqNames = _.uniq(usernames);
              if(uniqNames.length === 1 && uniqNames[0] === idea.inventorName) {
                hasContributors = false;
              }
            }
            return StripeService.fundCampaign(campaign, idea, hasContributors);
          });
        } catch (error) {
          console.error(error);
        }
      } else {
        return CampaignPayment.find({'_id': {$in: campaign.payments}}).exec().then(function (payments) {
          var usernames = payments.map(function (campaignPayment) {
            return campaignPayment.username;
          });
          return EmailService.sendGoalNotReachedFunders(usernames, idea);
        });
      }
    });
  });
}

exports.processCampaignClosings = function() {
  console.log('Checking campaigns for any that should be completed');
  return fetchCampaignsToProcess().then(function(campaigns) {
    var promises = campaigns.map(processCampaignClosing);
    return Promise.all(promises);
  });
};
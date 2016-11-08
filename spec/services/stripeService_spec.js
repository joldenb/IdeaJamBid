var should = require('chai').should();

var sinon = require('sinon');
var stripe = require('stripe')('test');
var Promise = require('bluebird');

require('../../models/aptitude');
var IdeaSeed = require('../../models/ideaSeed');
var Campaign = require('../../models/campaign');
var CampaignPayment = require('../../models/campaignPayment');
var CrowdfundingService = require('../../services/crowdfundingService');
var EmailService = require('../../services/emailService');
var StripeService = require('../../services/stripeService');
var SpecHelper = require('../specHelper');


describe('Stripe Service', function () {
  const ideaName = 'payments';
  var campaign, ideaSeed;

  before('setup campaign', function(done) {
    StripeService._setStripe(stripe);
    var campaignData = {
      goal: "10000",
      prizeName0: "prize name",
      prizeDesc0: "test prize description",
      prizeCost0: "300"
    };
    SpecHelper.createOrFindTestAccount('testuser@madeuptesturl.com').then(function(account) {
      SpecHelper.createOrFindIdeaSeed(account, ideaName, "public").then(function(idea) {
        ideaSeed = idea;
        CrowdfundingService.createCampaign(campaignData, account, ideaName).then(function(newCampaign) {
          campaign = newCampaign;
          done();
        });
      });
    });
  });

  it('should create payments on a campaign', function (done) {
    var stub = sinon.stub(stripe.customers, 'create');
    stub.returns(Promise.resolve({id: '123'}));
    var emailStub = sinon.stub(EmailService, 'sendPledgeConfirmation');
    emailStub.returns(true);

    SpecHelper.createOrFindTestAccount('testuser@madeuptesturl.com').then(function(account) {
      StripeService
        .delayedChargeCreation('mytesttoken', '15000', campaign.prizes[0], account, ideaName)
        .then(function (success){
          IdeaSeed.findOne({name: ideaName}).exec(function(err, ideaSeed) {
            try {
              var campaign = ideaSeed.campaigns[0];
              campaign.payments.length.should.eql(1);
              CampaignPayment.findById(campaign.payments[0]).then(function(payment) {
                try {
                  payment.amount.should.eql(15000);
                  payment.prize.should.eql(campaign.prizes[0]);
                  emailStub.should.have.been.called;
                  done();
                } catch (error) {
                  done(error);
                }
              });
            } catch(error) {
              done(error);
            }
          });
        });
    });
  });

  it('should fund a campaign', function (done) {
    var stub = sinon.stub(stripe.charges, 'create');
    stub.returns(Promise.resolve({id: 'ch_123456'}));
    Campaign.findById(campaign._id).then(function(campaign) {
      return StripeService.fundCampaign(campaign, ideaSeed);
    }).then(function (results) {
      try {
        results[0].should.eql('ch_123456');
        done();
      } catch(error) {
        done(error);
      }
    });
  });
});
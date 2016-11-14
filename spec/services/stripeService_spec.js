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
  let customersCreateStub, emailStub, chargesStub;

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

  beforeEach('setup stubs', function() {
    customersCreateStub = sinon.stub(stripe.customers, 'create');
    customersCreateStub.returns(Promise.resolve({id: '123'}));
    emailStub = sinon.stub(EmailService, 'sendPledgeConfirmation');
    emailStub.returns(true);
    chargesStub = sinon.stub(stripe.charges, 'create');
    chargesStub.returns(Promise.resolve({id: 'ch_123456', application_fee: {balance_transaction: 'bln_tx_123'}}));
  });

  afterEach('restore stubs', function () {
    customersCreateStub.restore();
    emailStub.restore();
    chargesStub.restore();
  });

  it('should create payments on a campaign', function (done) {
    SpecHelper.createOrFindTestAccount('testuser@madeuptesturl.com').then(function(account) {
      StripeService
        .delayedChargeCreation('mytesttoken', '150', campaign.prizes[0], account, ideaName)
        .then(function (success){
          IdeaSeed.findOne({name: ideaName}).exec(function(err, ideaSeed) {
            try {
              var campaign = ideaSeed.campaigns[0];
              campaign.payments.length.should.eql(1);
              CampaignPayment.findById(campaign.payments[0]).then(function(payment) {
                try {
                  payment.amount.should.eql(150);
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
    Campaign.findById(campaign._id).then(function(campaign) {
      return StripeService.fundCampaign(campaign, ideaSeed);
    }).then(function (results) {
      try {
        results.length.should.eql(1);
        results[0].chargeId.should.eql('ch_123456');
        results[0].feeBalTxn.should.eql('bln_tx_123');
        results[0].collectedAppAmt.should.eql(3000);
        done();
      } catch(error) {
        done(error);
      }
    });
  });

  it('should not double charge a card when funding a campaign', function (done) {
    Campaign.findById(campaign._id).then(function(campaign) {
      return StripeService.fundCampaign(campaign, ideaSeed);
    }).then(function () {
      try {
        chargesStub.should.not.have.been.called;
        done();
      } catch(error) {
        done(error);
      }
    });
  });
});
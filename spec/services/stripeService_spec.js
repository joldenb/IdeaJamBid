var should = require('chai').should();

var sinon = require('sinon');
const stripeLib = require('stripe');
const stripe = stripeLib('test');
const StripeStub = sinon.stub(stripeLib.Stripe, 'Stripe', function() {
  return stripe;
});
var Promise = require('bluebird');

require('../../models/aptitude');
var IdeaSeed = require('../../models/ideaSeed');
var CampaignPayment = require('../../models/campaignPayment');
var CrowdfundingService = require('../../services/crowdfundingService');
var StripeService = require('../../services/stripeService');
var SpecHelper = require('../specHelper');


describe('Stripe Service', function () {
  const ideaName = 'payments';
  before('setup campaign', function(done) {
    SpecHelper.createOrFindTestAccount('testuser@madeuptesturl.com', function(account) {
      SpecHelper.createOrFindIdeaSeed(account, ideaName, "public").then(function() {
        CrowdfundingService.createCampaign({goal: 1000}, account, ideaName).then(function() {
          done();
        });
      });
    });
  });

  it('should create payments on a campaign', function (done) {
    var stub = sinon.stub(stripe.customers, 'create');
    stub.returns(Promise.resolve({id: '123'}));

    SpecHelper.createOrFindTestAccount('testuser@madeuptesturl.com', function(account) {
      StripeService
        .delayedChargeCreation('mytesttoken', '15000', account, ideaName)
        .then(function (success){
          IdeaSeed.findOne({name: ideaName}).exec(function(err, ideaSeed) {
            try {
              var campaign = ideaSeed.campaigns[0];
              campaign.payments.length.should.eql(1);
              CampaignPayment.findById(campaign.payments[0]).then(function(payment) {
                try {
                  payment.amount.should.eql(15000);
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
    stub.returns(Promise.resolve(true));

    StripeService.fundCampaign(ideaName).then(function (results) {
      try {
        results[0].should.eql(true);
        done();
      } catch(error) {
        done(error);
      }
    });
  });
});
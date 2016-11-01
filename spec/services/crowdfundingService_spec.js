var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);

var CrowdfundingService = require('../../services/crowdfundingService');
var CampaignPrize = require('../../models/campaignPrize');
var CampaignPayment = require('../../models/campaignPayment');
var IdeaSeed = require('../../models/ideaSeed');
var SpecHelper = require('../specHelper');

const ideaName = 'automation';

describe('Crowdfunding Service', function () {
  it('should create a campaign', function (done) {
    var body = {
      goal: "10000",
      prizeName0: "1 automa",
      prizeDesc0: "You'll get one automated developers",
      prizeCost0: "300",
      prizeImageUrl0: "https://myfaketest.com/test.jpg",
      prizeName1: "2 automas",
      prizeDesc1: "You'd get three automated developers!",
      prizeCost1: "550",
      prizeName2: "5 automas",
      prizeDesc2: "You'll get five automated developers",
      prizeCost2: "850",
      prizeImageUrl2: "https://myfaketest.com/test2.jpg"
    };

    SpecHelper.createOrFindTestAccount('testuser@madeuptesturl.com', function(account) {
      SpecHelper.createOrFindIdeaSeed(account, ideaName, "public").then(function() {
        CrowdfundingService.createCampaign(body, account, ideaName).then(function(campaign) {
          SpecHelper.createOrFindIdeaSeed(account, ideaName, "public").then(function(ideaSeed) {
            try {
              ideaSeed.campaigns.length.should.eql(1);
              var campaign = ideaSeed.campaigns[0];
              campaign.goal.should.eql(parseInt(body.goal));
              campaign.prizes.length.should.eql(3);
            } catch (error) {
              done(error);
              return;
            }
            CampaignPrize.findById(campaign.prizes[0]).then(function(prize) {
              try {
                prize.name.should.eql(body.prizeName0);
                prize.description.should.eql(body.prizeDesc0);
                prize.cost.should.eql(parseInt(body.prizeCost0));
                prize.imageUrl.should.eql(body.prizeImageUrl0);
                done()
              } catch (error) {
                done(error);
              }
            });
          });
        });
      });
    });
  });

  it('should pay contributors of the campaign', function () {
    var stub = sinon.stub(CrowdfundingService, '_paypalPayContributors');
    stub.returns(true);

    CrowdfundingService.payContributors(['billingb@gmail.com', 'joseph.oldenburg@gmail.com'], ideaName).should.be.true;

    stub.should.have.been.calledWith(sinon.match(function(data) {
      return data.items.length == 2 &&
        data.items[0].amount.value == 1500 &&
        data.items[0].receiver == 'billingb@gmail.com';
    }));
  });

  it('should compute the total raised for a campaign', function(done) {
    IdeaSeed.findOne({name: ideaName}).exec().then(function(ideaSeed) {
      var campaign = CrowdfundingService.getOpenCampaign(ideaSeed);

      var payments = [250, 350, 500].map(function (payment) {
        var campaignPayment = new CampaignPayment({
          username: 'testuser@fake.com',
          stripeCustomerId: '123',
          amount: payment
        });
        return campaignPayment.save().then(function (campaignPayment) {
          campaign.payments.push(campaignPayment.id);
          return campaign.save();
        });
      });

      Promise.all(payments).then(function () {
        IdeaSeed.findOne({name: ideaName}).exec().then(function (ideaSeed) {
          var campaign = CrowdfundingService.getOpenCampaign(ideaSeed);
          CrowdfundingService.sumPayments(campaign).then(function (sum) {
            try {
              sum.should.eql(1100);
              done();
            } catch (error) {
              done(error);
            }
          });
        });
      });
    });
  });
});
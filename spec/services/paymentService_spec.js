var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.should();
var moment = require('moment');

var CrowdfundingService = require('../../services/crowdfundingService');
var PaymentService = require('../../services/paymentService');
var CampaignPayment = require('../../models/campaignPayment');
var Campaign = require('../../models/campaign');
var Component = require('../../models/component');
var IdeaSeed = require('../../models/ideaSeed');
var SpecHelper = require('../specHelper');

const ideaName = 'automation';

describe('Payment Service', function () {
  var account, ideaSeed;
  var contribAccounts = [];
  var components = [];
  var variantNames = ['test variant 1', 'test variant 2'];
  const basicBody = {
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
  before('setup account and idea seed', function(done) {
    var contribAccountPromises = [1, 2, 3, 4].map(function(value) {
      return SpecHelper.createOrFindTestAccount('testuser' + value + '@madeuptesturl.com');
    });
    var accountPromise = SpecHelper.createOrFindTestAccount('testuser@madeuptesturl.com');
    let savePromises = [accountPromise];
    savePromises.push(...(contribAccountPromises));

    Promise.all(savePromises).then(function(savedModels) {
      account = savedModels[0];
      contribAccounts = savedModels.slice(1, 5);
      return SpecHelper.createOrFindIdeaSeed(account, ideaName, "public");
    }).then(function(idea){
      ideaSeed = idea;
      let promises = contribAccounts.map(function (newAccount, index) {
        var component = new Component({
          descriptions: [index + ' component'],
          ideaSeed: [ideaSeed],
          creator: newAccount
        });
        return component.save();
      });
      var component = new Component({
        descriptions: ['noseed component'],
        creator: account
      });
      promises.push(component.save());
      return Promise.all(promises);
    }).then(function (newComponents) {
      components.push(...newComponents);

      var variants = [{
        name: variantNames[0],
        components: [components[2]._id, components[3]._id]
      }, {
        name: variantNames[1],
        components: [components[3]._id]
      }];
      ideaSeed.variants = variants;
      return ideaSeed.save();
    }).then(function (idea) {
      ideaSeed = idea;
      done();
    });
  });

  beforeEach('delete campaigns', function (done) {
    var delCampaingsPromise = Campaign.remove({}).exec();
    ideaSeed.campaigns = [];
    var resetIdeaCampaignsPromise = ideaSeed.save();

    Promise.all([delCampaingsPromise, resetIdeaCampaignsPromise]).then(function(results) {
      return results[1]
    }).then(function(idea) {
      ideaSeed = idea;
      done();
    });
  });

  it('should pay contributors of the campaign', function (done) {
    var stub = sinon.stub(PaymentService, '_paypalPayContributors');
    stub.returns(true);

    CrowdfundingService.createCampaign(basicBody, account, ideaName).then(function () {
      let contributorsWithCounts = {
        "testuser1@madeuptesturl.com": 1,
        "testuser2@madeuptesturl.com": 2
      };
      try {
        PaymentService.payContributors(contributorsWithCounts, 3000).should.be.true;

        stub.should.have.been.calledWith(sinon.match(function (data) {
          return data.items.length == 2 &&
            data.items[0].amount.value == 1000 &&
            data.items[0].receiver == 'testuser1@madeuptesturl.com' &&
            data.items[1].amount.value == 2000 &&
            data.items[1].receiver == 'testuser2@madeuptesturl.com';
        }));
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it('should calculate the contributors payment percent', function() {
    PaymentService.contributorPaymentPercent(2, 6).should.eql(3.33);
  });

  it('should calculate the contributors payment amount', function() {
    PaymentService.contributorPaymentAmount(2000, 2, 6).should.eql(666.66);
  });

  it('should compute the total raised for a campaign', function(done) {
    CrowdfundingService.createCampaign(basicBody, account, ideaName).then(function (campaign) {
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
      return Promise.all(payments);
    }).then(function () {
      IdeaSeed.findOne({name: ideaName}).exec().then(function (ideaSeed) {
        var campaign = CrowdfundingService.getOpenCampaign(ideaSeed);
        PaymentService.sumPayments(campaign).then(function (sum) {
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
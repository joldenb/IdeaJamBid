var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.should();
var moment = require('moment');

var CrowdfundingService = require('../../services/crowdfundingService');
var CampaignPrize = require('../../models/campaignPrize');
var CampaignPayment = require('../../models/campaignPayment');
var Campaign = require('../../models/campaign');
var IdeaSeed = require('../../models/ideaSeed');
var Component = require('../../models/component');
var SpecHelper = require('../specHelper');

const ideaName = 'automation';

describe('Crowdfunding Service', function () {
  var account, ideaSeed;
  var contribAccounts = [];
  var components = [];
  var variantNames = ['test variant 1', 'test variant 2']
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

  describe('campaign creation', function() {
    it('should create a campaign', function (done) {
      let body = basicBody;
      CrowdfundingService.createCampaign(body, account, ideaName).then(function () {
        IdeaSeed.findById(ideaSeed._id).exec().then(function (idea) {
          ideaSeed = idea;
          try {
            idea.campaigns.length.should.eql(1);
            var campaign = idea.campaigns[0];
            campaign.goal.should.eql(parseInt(body.goal));
            (typeof campaign.variant).should.equal('undefined');
            moment(campaign.startDate).format('YYYY-MM-DD').should.eql(moment().format('YYYY-MM-DD'));
            moment(campaign.endDate).format('YYYY-MM-DD').should.eql(moment().add(60, 'days').format('YYYY-MM-DD'));
            campaign.prizes.length.should.eql(3);
          } catch (error) {
            done(error);
            return;
          }
          CampaignPrize.findById(campaign.prizes[0]).then(function (prize) {
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

    it('should not create a variant campaign with name none', function(done) {
      let body = {
        variant: 'none'
      };
      Object.assign(body, basicBody);
      CrowdfundingService.createCampaign(body, account, ideaName).then(function () {
        IdeaSeed.findOne({name: ideaName}).exec().then(function (idea) {
          ideaSeed = idea;
          try {
            ideaSeed.campaigns.length.should.eql(1);
            var campaign = ideaSeed.campaigns[0];
            (typeof campaign.variant).should.equal('undefined');
            done();
          } catch (error) {
            done(error);
            return;
          }
        });
      });
    });

    it('should create a variant campaign', function(done) {
      let body = {
        variant: variantNames[0]
      };
      Object.assign(body, basicBody);
      CrowdfundingService.createCampaign(body, account, ideaName).then(function (campaign) {
        IdeaSeed.findOne({name: ideaName}).exec().then(function (idea) {
          ideaSeed = idea;
          try {
            ideaSeed.campaigns.length.should.eql(1);
            var campaign = ideaSeed.campaigns[0];
            campaign.variant.should.eql(variantNames[0]);
            campaign.prizes.length.should.eql(3);
            done();
          } catch (error) {
            done(error);
            return;
          }
        });
      });
    });
  });

  it('should pay contributors of the campaign', function (done) {
    var stub = sinon.stub(CrowdfundingService, '_paypalPayContributors');
    stub.returns(true);

    CrowdfundingService.createCampaign(basicBody, account, ideaName).then(function () {
      CrowdfundingService.payContributors(['billingb@gmail.com', 'joseph.oldenburg@gmail.com'], ideaName).should.be.true;

      stub.should.have.been.calledWith(sinon.match(function(data) {
        return data.items.length == 2 &&
          data.items[0].amount.value == 1500 &&
          data.items[0].receiver == 'billingb@gmail.com';
      }));
      done();
    });
  });

  describe('open campaign', function() {
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

  describe('campaign components', function () {
    it('Lists all the components for the root idea', function(done) {
      CrowdfundingService.createCampaign(basicBody, account, ideaName).then(function (campaign) {
        return CrowdfundingService.getComponents(campaign, ideaSeed);
      }).then(function(ideaComponents) {
        try {
          var expectedComponentIds = components.slice(0, 4).map(function(c) { return c.descriptions[0]; }).sort();
          var ideaComponentIds = ideaComponents.map(function(c) { return c.descriptions[0]; }).sort();
          ideaComponentIds.should.eql(expectedComponentIds);
          done();
        } catch(error) {
          done(error);
        }
      });
    });

    it('List all components for a variant idea', function(done) {
      let body = {
        variant: variantNames[0]
      };
      Object.assign(body, basicBody);
      CrowdfundingService.createCampaign(body, account, ideaName).then(function (campaign) {
        return CrowdfundingService.getComponents(campaign, ideaSeed);
      }).then(function(ideaComponents) {
        try {
          var expectedComponentIds = components.slice(2, 4).map(function(c) { return c.descriptions[0]; }).sort();
          var ideaComponentIds = ideaComponents.map(function(c) { return c.descriptions[0]; }).sort();
          ideaComponentIds.should.eql(expectedComponentIds);
          done();
        } catch(error) {
          done(error);
        }
      });
    });
  });
});
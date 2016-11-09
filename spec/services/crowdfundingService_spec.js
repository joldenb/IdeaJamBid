var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.should();
var moment = require('moment');
var stripe = require('stripe')('test');
var EmailService = require('../../services/emailService');
var CrowdfundingService = require('../../services/crowdfundingService');
var StripeService = require('../../services/stripeService');
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
  var variantNames = ['test variant 1', 'test variant 2', 'test variant inventor contrib'];
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
          creator: newAccount.username
        });
        return component.save();
      });
      var componentExtra = new Component({
        descriptions: ['extra component'],
        ideaSeed: [ideaSeed],
        creator: contribAccounts[0].username
      });
      promises.push(componentExtra.save());
      var component = new Component({
        descriptions: ['noseed component'],
        creator: account.username
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
      }, {
        name: variantNames[2],
        components: [components[5]._id]
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

  describe('open campaign', function() {
    it('should check campaign status and return false when campaign is not fully funded', function(done) {
      CrowdfundingService.createCampaign(basicBody, account, ideaName).then(function (campaign) {
        return CrowdfundingService.checkCampaignFunding(ideaSeed, campaign);
      }).then(function(checkResult) {
        checkResult.should.be.false;
        done();
      });
    });

    it('should check campaign status and return true when campaign is fully funded prior to this check', function(done) {
      CrowdfundingService.createCampaign(basicBody, account, ideaName).then(function (campaign) {
        campaign.goalReached = true;
        return CrowdfundingService.checkCampaignFunding(ideaSeed, campaign);
      }).then(function(checkResult) {
        try {
          checkResult.should.be.true;
          done();
        } catch(error) {
          done(error);
        }

      });
    });

    it('should check campaign status and send emails when the campaign is fully funded', function(done) {
      var stub = sinon.stub(EmailService, 'sendGoalReachedContributorEmails');
      stub.returns(true);
      var newCampaign;
      CrowdfundingService.createCampaign(basicBody, account, ideaName).then(function (campaign) {
        var payments = [2500, 3500, 5000].map(function (payment) {
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
        newCampaign = campaign;
        return Promise.all(payments);
      }).then(function() {
        return CrowdfundingService.checkCampaignFunding(ideaSeed, newCampaign);
      }).then(function(checkResult) {
        var expectedUsernames = {
          'testuser1@madeuptesturl.com': 2,
          'testuser2@madeuptesturl.com': 1,
          'testuser3@madeuptesturl.com': 1,
          'testuser4@madeuptesturl.com': 1
        };
        try {
          checkResult.should.be.true;
          stub.should.have.been.calledWith(expectedUsernames, sinon.match({_id: ideaSeed._id}), sinon.match({_id: newCampaign._id}));
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe('campaign components', function () {
    it('Lists all the components for the root idea', function(done) {
      CrowdfundingService.createCampaign(basicBody, account, ideaName).then(function (campaign) {
        return CrowdfundingService.getComponents(campaign, ideaSeed);
      }).then(function(ideaComponents) {
        try {
          var expectedComponentIds = components.slice(0, 5).map(function(c) { return c.descriptions[0]; }).sort();
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

  describe('close campaign', function() {
    var campaign;
    var chargeStub, emailStub, emailReceiptStub;
    beforeEach('setup funded campaign', function(done) {
      chargeStub = sinon.stub(stripe.charges, 'create');
      chargeStub.returns(Promise.resolve({id: 'ch_123456'}));
      StripeService._setStripe(stripe);
      emailStub = sinon.stub(EmailService, 'sendGoalNotReachedFunders');
      emailStub.returns(true);
      emailReceiptStub = sinon.stub(EmailService, 'sendCardCharged');
      emailReceiptStub.returns(true);

      CrowdfundingService.createCampaign(basicBody, account, ideaName).then(function(newCampaign) {
        newCampaign.endDate = new Date();
        return newCampaign.save();
      }).then(function (newCampaign) {
        var payments = [2500, 3500, 5000].map(function (payment) {
          var campaignPayment = new CampaignPayment({
            username: 'testuser@fake.com',
            stripeCustomerId: '123',
            amount: payment
          });
          return campaignPayment.save().then(function (campaignPayment) {
            newCampaign.payments.push(campaignPayment.id);
            return newCampaign.save();
          });
        });
        campaign = newCampaign;
        return Promise.all(payments);
      }).then(function() {
        done();
      });
    });

    afterEach('reset stubs', function() {
      chargeStub.restore();
      emailStub.restore();
      emailReceiptStub.restore();
    });

    it('processes closing on campaigns that have reach their goal and are ready to be complete', function(done) {
      return CrowdfundingService.processCampaignClosings().then(function() {
        return Campaign.findById(campaign._id).exec();
      }).then(function(c) {
        try {
          c.state.should.eql('funded');
          moment(c.startProcessingDate).format('YYYY-MM-DD').should.eql(moment().format('YYYY-MM-DD'));
          chargeStub.should.have.been.calledWith(sinon.match({amount: 2500, application_fee: 572.8}));
          chargeStub.should.have.been.calledThrice;
          emailReceiptStub.should.have.been.calledThrice;
          done();
        } catch(error) {
          done(error);
        }
      });
    });

    it('does not process campaigns that are not open', function(done) {
      campaign.state = 'processing_payments';
      campaign.save().then(function(c) {
        campaign = c;
      }).then(function() {
        return CrowdfundingService.processCampaignClosings()
      }).then(function() {
        try {
          chargeStub.should.not.have.been.called;
          emailReceiptStub.should.not.have.been.called;
          done();
        } catch(error) {
          done(error);
        }
      });
    });

    it('processes closing on campaigns with no contributors paying 90%', function(done) {
      campaign.variant = variantNames[2];
      campaign.save().then(function(c) {
        campaign = c;
      }).then(function() {
        return CrowdfundingService.processCampaignClosings()
      }).then(function() {
        return Campaign.findById(campaign._id).exec();
      }).then(function(c) {
        try {
          c.state.should.eql('funded');
          moment(c.startProcessingDate).format('YYYY-MM-DD').should.eql(moment().format('YYYY-MM-DD'));
          chargeStub.should.have.been.calledWith(sinon.match({amount: 2500, application_fee: 322.8}));
          chargeStub.should.have.been.calledThrice;
          emailReceiptStub.should.have.been.calledThrice;
          done();
        } catch(error) {
          done(error);
        }
      });
    });

    it('processes closing on campaigns that have not reach their goal and are ready to be complete', function(done) {
      campaign.goal = 100000;
      campaign.save().then(function(){
        return CrowdfundingService.processCampaignClosings();
      }).then(function() {
        return Campaign.findById(campaign._id).exec();
      }).then(function(c) {
        try {
          c.state.should.eql('unsuccessful');
          emailStub.should.have.been.calledWith(
            ['testuser@fake.com', 'testuser@fake.com', 'testuser@fake.com'],
            sinon.match({_id: ideaSeed._id}));
          done();
        } catch(error) {
          done(error);
        }
      });
    });
  });
});
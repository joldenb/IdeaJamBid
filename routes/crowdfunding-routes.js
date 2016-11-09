var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var StripeService = require('../services/stripeService');
var CrowdfundingService = require('../services/crowdfundingService');
const PaymentService = require('../services/paymentService');
var Account = require('../models/account');
var IdeaSeed = require('../models/ideaSeed');
var CampaignPrize = require('../models/campaignPrize');
var moment = require('moment');

router.get('/ideas/:ideaName/campaign/new', csrfProtection, function(req, res){
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }
  var query = IdeaSeed.findOne({"name" : req.params.ideaName});
  query.exec().then(function(idea){
    res.render('pages/campaign/new', {
      csrfToken: req.csrfToken(),
      user: req.user,
      idea: idea,
      endDate: moment().add(60, 'days').calendar()
    });
  });
});

router.post('/ideas/:ideaName/campaign/new', csrfProtection, function(req, res){
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  Account.findOne({'username': req.user.username}).then(function (account) {
    CrowdfundingService.createCampaign(req.body, account, req.params.ideaName);

    if(account.stripeCredentials === undefined || account.stripeCredentials.access_token === undefined) {
      res.redirect('/ideas/' + req.params.ideaName +'/campaign/connect');
    } else {
      res.redirect('/ideas/' + req.params.ideaName + '/campaign');
    }
  });
});

router.get('/ideas/:ideaName/campaign/connect', csrfProtection, function(req, res) {
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  var query = IdeaSeed.findOne({"name" : req.params.ideaName});

  var redirectUri = 'https://' + req.hostname + '/stripe-campaign-connect';
  if(req.hostname === 'localhost') {
    redirectUri = 'http://localhost:5000/stripe-campaign-connect';
  }

  query.exec().then(function(idea){
    res.render('pages/campaign/connect', {
      csrfToken: req.csrfToken(),
      user: req.user,
      idea: idea,
      redirectUri: redirectUri,
      stripeClientId: process.env.STRIPE_CLIENT_ID
    })
  });
});

router.get('/stripe-campaign-connect', csrfProtection, function(req, res) {
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  var connectPromise = StripeService.connect(req.query, req.user);
  connectPromise.then(function(ideaName) {
      if(ideaName !== undefined && ideaName !== null) {
        res.redirect('/ideas/' + ideaName + '/campaign');
      } else {
        res.redirect('/imagineer/' + req.user.nickname);
      }
      return;
    })
    .catch(function (err) {
      console.error('Error in connecting Stripe account: ', err);
      res.render('pages/404'); //TODO: make error page for connecting
    });
});

router.get('/ideas/:ideaName/campaign', csrfProtection, function(req, res){
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  let idea, prizes = [], openCampaign, totalPayments, components;

  var query = IdeaSeed.findOne({"name" : req.params.ideaName});
  query.exec().then(function(ideaSeed) {
    idea = ideaSeed;
    openCampaign = CrowdfundingService.getOpenCampaign(idea);
    return CampaignPrize.find({'_id': {$in: openCampaign.prizes}}).exec()
  }).then(function (campaignPrizes) {
    prizes = campaignPrizes;
    return PaymentService.sumPayments(openCampaign)
  }).then(function (total) {
    totalPayments = total;
    return CrowdfundingService.getComponents(openCampaign, idea);
  }).then(function(campaignComponents) {
    components = campaignComponents;
    res.render('pages/campaign/view', {
      csrfToken: req.csrfToken(),
      user: req.user,
      idea: idea,
      campaign: openCampaign,
      funderTotalPayments: totalPayments,
      prizes: prizes,
      components: components
    });
  })
});

router.post('/ideas/:ideaName/campaign/stripe-payment', csrfProtection, function(req, res){
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  StripeService
    .delayedChargeCreation(req.body.tokenId, req.body.amount, req.body.prizeId, req.user, req.params.ideaName)
    .then(function (success){
      if(success) {
       res.send('success');
      } else {
       res.status(400).send('Transaction failed');
      }
    }).catch(function (error) {
      console.log("error creating customer: " + error);
      res.status(400).send('Payment creation failed');
    });
});

router.get('/paypalTestPayment', csrfProtection, function(req, res) {
  try {
    CrowdfundingService.payContributors(['billingb@gmail.com', 'joseph.oldenburg@gmail.com'], 'test');
    res.send('success');
  } catch(error) {
    res.status(500).send('Failed to pay contributors');
  }
});

module.exports = router;
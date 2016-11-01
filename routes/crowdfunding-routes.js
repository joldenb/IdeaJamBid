var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var stripeService = require('../services/stripeService');
var crowdfundingService = require('../services/crowdfundingService');
var Account = require('../models/account');
var IdeaSeed = require('../models/ideaSeed');
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
    crowdfundingService.createCampaign(req.body, account, req.params.ideaName);

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
      redirectUri: redirectUri
    })
  });
});

router.get('/stripe-campaign-connect', csrfProtection, function(req, res) {
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  var connectPromise = stripeService.connect(req.query, req.user);
  connectPromise.then(function(ideaName) {
      if(ideaName !== undefined && ideaName !== null) {
        res.redirect('/ideas/' + ideaName + '/campaign');
      } else {
        res.redirect('/imagineer/' + req.user.nickname);
      }
      return;
    })
    .catch(function (err) {
      res.render('pages/404'); //TODO: make error page for connecting
    });
});

router.get('/ideas/:ideaName/campaign', csrfProtection, function(req, res){
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  var query = IdeaSeed.findOne({"name" : req.params.ideaName});
  query.exec().then(function(idea){
    res.render('pages/campaign/view', {
      csrfToken: req.csrfToken(),
      user: req.user,
      idea: idea
    });
  });
});

router.post('/ideas/:ideaName/campaign/stripe-payment', csrfProtection, function(req, res){
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  stripeService
    .delayedChargeCreation(req.body.tokenId, req.body.amount, req.user, req.params.ideaName)
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

router.post('/ideas/:ideaName/campaign/fund', csrfProtection, function(req, res) {
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  stripeService
    .fundCampaign(req.params.ideaName)
    .then(function (success){
      if(success) {
        res.send('success');
      } else {
        res.status(400).send('Funding the campaign failed');
      }
    })
    .catch(function (error) {
      console.log("error funding campaign: " + error);
      res.status(400).send('Funding the campaign failed');
    });

});

router.get('/paypalTestPayment', csrfProtection, function(req, res) {
  try {
    crowdfundingService.payContributors(['billingb@gmail.com', 'joseph.oldenburg@gmail.com'], 'test');
    res.send('success');
  } catch(error) {
    res.status(500).send('Failed to pay contributors');
  }
});

module.exports = router;
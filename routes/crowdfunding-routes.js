var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var stripeService = require('../helpers/stripeService');

router.get('/new-campaign', csrfProtection, function(req, res){
  res.render('pages/campaign/new-campaign', {
    csrfToken: req.csrfToken(),        
    user: {}
  });
});

router.post('/new-campaign', csrfProtection, function(req, res){
  //TODO: Hey - we need to actually save stuff here
  res.render('pages/campaign/connect-campaign', {
    csrfToken: req.csrfToken(),
    user: {}
  });
});

router.get('/connect-campaign', csrfProtection, function(req, res) {
  res.render('pages/campaign/connect-campaign', {
    csrfToken: req.csrfToken(),
    user: {}
  })
});

router.get('/stripe-campaign-connect', csrfProtection, function(req, res) {
  //TODO: Need to handle multiple campaigns with /connect-campaign/<id> route

  stripeService.connect(req.query)
    .then(function() {
      res.render('pages/campaign/campaign', {
        csrfToken: req.csrfToken(),
        user: {}
      });
    })
    .catch(function (err) {
      res.render('pages/404'); //TODO: make error page for connecting
    });
});

router.get('/campaign', csrfProtection, function(req, res){
  //TODO: Need to handle multiple campaigns with /campaign/<id> route
  res.render('pages/campaign/campaign', {
    csrfToken: req.csrfToken(),
    user : {}
  });
});

router.post('/stripe-payment', csrfProtection, function(req, res){
  stripeService.charge(req.body.tokenId, req.body.amount).then(function (success){
   if(success) {
     res.send('success');
   } else {
     res.status(400).send('Transaction failed');
   }
  });
});

module.exports = router;
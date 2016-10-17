var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var stripeService = require('../helpers/stripeService');

router.get('/new-campaign', csrfProtection, function(req, res){
  res.render('pages/new-campaign', {
    csrfToken: req.csrfToken(),        
    user : {}
  });
});

router.post('/new-campaign', csrfProtection, function(req, res){
  res.render('pages/campaign', {
    user : {},
    csrfToken: req.csrfToken()
  });
});

router.get('/campaign', csrfProtection, function(req, res){
  res.render('pages/campaign', {
    user : {},
    csrfToken: req.csrfToken()
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
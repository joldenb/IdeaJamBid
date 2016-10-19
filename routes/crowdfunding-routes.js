var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var stripeService = require('../helpers/stripeService');

router.get('/new-campaign', csrfProtection, function(req, res){
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  res.render('pages/campaign/new-campaign', {
    csrfToken: req.csrfToken(),
    user: req.user
  });
});

router.post('/new-campaign', csrfProtection, function(req, res){
  //TODO: Hey - we need to actually save stuff here
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  if(req.user.stripeCredentials && req.user.stripeCredentials.access_token) {
    res.render('pages/campaign/connect-campaign', {
      csrfToken: req.csrfToken(),
      user: req.user
    });
  } else {
    res.render('pages/campaign/campaign', {
      csrfToken: req.csrfToken(),
      user: req.user
    });
  }
});

router.get('/connect-campaign', csrfProtection, function(req, res) {
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  res.render('pages/campaign/connect-campaign', {
    csrfToken: req.csrfToken(),
    user: req.user
  })
});

router.get('/stripe-campaign-connect', csrfProtection, function(req, res) {
  //TODO: Need to handle multiple campaigns with /connect-campaign/<id> route
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  stripeService.connect(req.query, req.user)
    .then(function() {
      res.render('pages/campaign/campaign', {
        csrfToken: req.csrfToken(),
        user: req.user
      });
    })
    .catch(function (err) {
      res.render('pages/404'); //TODO: make error page for connecting
    });
});

router.get('/campaign', csrfProtection, function(req, res){
  //TODO: Need to handle multiple campaigns with /campaign/<id> route
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  res.render('pages/campaign/campaign', {
    csrfToken: req.csrfToken(),
    user: req.user
  });
});

router.post('/stripe-payment', csrfProtection, function(req, res){
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  stripeService.charge(req.body.tokenId, req.body.amount).then(function (success){
   if(success) {
     res.send('success');
   } else {
     res.status(400).send('Transaction failed');
   }
  });
});

module.exports = router;
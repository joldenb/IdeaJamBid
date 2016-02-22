var express = require('express');
var passport = require('passport');
var mongoose = require('mongoose');
var IdeaSeed = require('../models/ideaSeed');
var Account = require('../models/account');
var router = express.Router();


router.get('/', function (req, res) {
    if(req.user){
      res.redirect('/begin');
    } else {
      res.render('index', { user : req.user });
    }
});

router.get('/register', function(req, res) {
    res.render('pages/register', { });
});

router.post('/register', function(req, res) {
    Account.register(new Account({ username : req.body.username,
      einsteinPoints: 0, rupees: 0 }), req.body.password, function(err, account) {
        if (err) {
            return res.render('pages/register', { account : account });
        }

        passport.authenticate('local')(req, res, function () {
            res.redirect('/');
        });
    });
});

router.get('/login', function(req, res) {
    res.render('pages/login', { user : req.user });
});

router.get('/begin-scoring', function(req, res) {
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/begin-scoring', { user : req.user, idea : currentIdea });
  });
});

router.get('/performability', function(req, res) {
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/performability', { user : req.user, idea : currentIdea });
  });
});

router.get('/begin', function(req, res) {
    if(req.user){
      res.render('pages/begin', { user : req.user });
    } else {
      res.redirect('/');
    }
});

router.get('/idea-name', function(req, res) {
    if(req.user){
      var newIdea = new IdeaSeed({});
      newIdea.save(function (err) {
        var stop;
      });
      req.session.idea = newIdea._doc._id.toHexString();
      res.render('pages/idea-name', { user : req.user, idea : req.session.idea });
    } else {
      res.redirect('/');
    }
});

router.post('/idea-name', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {name : req.body.title, description : req.body.description},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/problem-solver');
});

router.post('/problem-solver', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {problem : req.body.problemToSolve},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/key-features');
});

router.post('/performability', function(req, res) {
  var perfSliderOneValue = $("#perfSliderOne").value(),
      perfSliderTwoValue = $("#perfSliderTwo").value(),
      perfSliderThreeValue = $("#perfSliderThree").value();

  IdeaSeed.update({_id : req.session.idea}, {performOne : perfSliderOneValue,
    performTwo : perfSliderTwoValue, performThree : perfSliderThreeValue},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/key-features');
});

router.post('/key-features', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {firstFeature : req.body.firstFeature,
    secondFeature : req.body.secondFeature, thirdFeature : req.body.thirdFeature},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/idea-seed-summary');
});

router.post('/napkin-sketch', function(req, res) {
  res.redirect('/idea-seed-summary');
});

router.post('/login', passport.authenticate('local'), function(req,res){
    res.redirect('/begin');
});

router.get('/idea-seed-summary', function(req, res){
  var currentIdea;
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/idea-seed-summary', { user : req.user, idea : currentIdea });
  });
});

router.get('/napkin-sketch', function(req, res){
  res.render('pages/problem-solver', { user : req.user, idea : req.session.idea });
});

router.get('/problem-solver', function(req, res){
  res.render('pages/problem-solver', { user : req.user, idea : req.session.idea });
});

router.get('/key-features', function(req, res){
  res.render('pages/key-features', { user : req.user, idea : req.session.idea });
});

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

// =====================================
// Google ROUTES =====================
// =====================================
// send to google to do the authentication
// profile gets us their basic information including their name
// email gets their emails
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', function(req, res, next) {
  passport.authenticate('google', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/login'); }

      passport.authenticate('local');
      res.redirect('/begin');

  })(req, res, next);
});

// =====================================
// Facebook ROUTES =====================
// =====================================
// send to google to do the authentication
// profile gets us their basic information including their name
// email gets their emails
router.get('/auth/facebook', passport.authenticate('facebook', { scope:  'email' }));

router.get('/auth/facebook/callback', function(req, res, next) {
  passport.authenticate('facebook', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/login'); }

      passport.authenticate('local');
      res.redirect('/begin');

  })(req, res, next);
});

// =====================================
// LinkedIn ROUTES =====================
// =====================================
// send to google to do the authentication
// profile gets us their basic information including their name
// email gets their emails
router.get('/auth/linkedin', passport.authenticate('linkedin'));

router.get('/auth/linkedin/callback', function(req, res, next) {
  passport.authenticate('linkedin', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/login'); }

      passport.authenticate('local');
      res.redirect('/begin');

  })(req, res, next);
});



module.exports = router;
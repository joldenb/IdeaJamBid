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

////////////////////////////////////////////////
// Performability
////////////////////////////////////////////////
router.get('/performability', function(req, res) {
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/performability', { user : req.user, idea : currentIdea });
  });
});

router.post('/performability', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {performOne : req.body.perfSliderOneValue,
    performTwo : req.body.perfSliderTwoValue, performThree : req.body.perfSliderThreeValue},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/affordability');
});

////////////////////////////////////////////////
// Affordability
////////////////////////////////////////////////
router.get('/affordability', function(req, res) {
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/affordability', { user : req.user, idea : currentIdea });
  });
});

router.post('/affordability', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {affordOne : req.body.affordSliderOneValue},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/featurability');
});

////////////////////////////////////////////////
// Featurability
////////////////////////////////////////////////
router.get('/featurability', function(req, res) {
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/featurability', { user : req.user, idea : currentIdea });
  });
});

router.post('/featurability', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {featureOne : req.body.featureSliderOneValue},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/deliverability');
});

////////////////////////////////////////////////
// Deliverability
////////////////////////////////////////////////
router.get('/deliverability', function(req, res) {
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/deliverability', { user : req.user, idea : currentIdea });
  });
});

router.post('/deliverability', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {deliverOne : req.body.deliverSliderOneValue},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/useability');
});

////////////////////////////////////////////////
// Useability
////////////////////////////////////////////////
router.get('/useability', function(req, res) {
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/useability', { user : req.user, idea : currentIdea });
  });
});

router.post('/useability', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {useabilityOne : req.body.useabilitySliderOneValue},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/maintainability');
});

////////////////////////////////////////////////
// Maintainability
////////////////////////////////////////////////
router.get('/maintainability', function(req, res) {
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/maintainability', { user : req.user, idea : currentIdea });
  });
});

router.post('/maintainability', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {maintainOne : req.body.maintainSliderOneValue},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/durability');
});

////////////////////////////////////////////////
// Durability
////////////////////////////////////////////////
router.get('/durability', function(req, res) {
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/durability', { user : req.user, idea : currentIdea });
  });
});

router.post('/durability', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {durabilityOne : req.body.durabilitySliderOneValue},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/imageability');
});

////////////////////////////////////////////////
// Imageability
////////////////////////////////////////////////
router.get('/imageability', function(req, res) {
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/imageability', { user : req.user, idea : currentIdea });
  });
});

router.post('/imageability', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {imageOne : req.body.imageSliderOneValue},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/complexity');
});

////////////////////////////////////////////////
// Complexity
////////////////////////////////////////////////
router.get('/complexity', function(req, res) {
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/complexity', { user : req.user, idea : currentIdea });
  });
});

router.post('/complexity', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {complexOne : req.body.complexSliderOneValue},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/precision');
});

////////////////////////////////////////////////
// Precision
////////////////////////////////////////////////
router.get('/precision', function(req, res) {
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/precision', { user : req.user, idea : currentIdea });
  });
});

router.post('/precision', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {precisionOne : req.body.precisionSliderOneValue},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/variability');
});
////////////////////////////////////////////////
// Variability
////////////////////////////////////////////////
router.get('/variability', function(req, res) {
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/variability', { user : req.user, idea : currentIdea });
  });
});

router.post('/variability', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {variabilityOne : req.body.variabilitySliderOneValue},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/sensitivity');
});
////////////////////////////////////////////////
// Sensitivity
////////////////////////////////////////////////
router.get('/sensitivity', function(req, res) {
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/sensitivity', { user : req.user, idea : currentIdea });
  });
});

router.post('/sensitivity', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {sensitivityOne : req.body.sensitivitySliderOneValue},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/immaturity');
});
////////////////////////////////////////////////
// Immaturity
////////////////////////////////////////////////
router.get('/immaturity', function(req, res) {
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/immaturity', { user : req.user, idea : currentIdea });
  });
});

router.post('/immaturity', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {immatureOne : req.body.immatureSliderOneValue},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/dangerous');
});
////////////////////////////////////////////////
// Dangerous
////////////////////////////////////////////////
router.get('/dangerous', function(req, res) {
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/dangerous', { user : req.user, idea : currentIdea });
  });
});

router.post('/dangerous', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {dangerOne : req.body.dangerSliderOneValue},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/skills');
});
////////////////////////////////////////////////
// Skill Intensive
////////////////////////////////////////////////
router.get('/skills', function(req, res) {
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/skills', { user : req.user, idea : currentIdea });
  });
});

router.post('/skills', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {skillsOne : req.body.skillsSliderOneValue},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/');
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
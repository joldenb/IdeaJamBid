var express = require('express');
var passport = require('passport');
var mongoose = require('mongoose');
var _ = require('underscore');
var IdeaSeed = require('../models/ideaSeed');
var Component = require('../models/component');
var IdeaReview = require('../models/ideaReviews');
var IdeaProblem = require('../models/ideaProblem');
var Account = require('../models/account');
var router = express.Router();
var multer = require('multer');


////////////////////////////////////////////////
// Alternative Ideas
////////////////////////////////////////////////
router.get('/alternative-ideas', function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/idea-data/idea-alternatives', {
      user : req.user, idea : currentIdea });
  });
});

router.post('/alternative-ideas', function(req, res) {
  var alternativeIdea = {
    name          : req.body.alternativeName,
    failureReason : req.body.failureReason,
    description   : req.body.description,
    differsBy     : req.body.differsBy

  };

  IdeaSeed.update(
    { _id : req.session.idea },
    { $push : { alternatives : alternativeIdea }},
    function(err, raw){
      console.log('The raw response from Mongo was ', raw);
    }
  );

  Account.findById( req.user.id,
    function (err, account) {
        account.einsteinPoints = account.einsteinPoints + 5;
        account.save(function (err) {
      });
  });
  res.redirect('/alternative-ideas');

});

////////////////////////////////////////////////
// Industries
////////////////////////////////////////////////
router.get('/industries', function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/idea-data/industries', {
      user : req.user, idea : currentIdea });
  });
});

router.post('/alternative-ideas', function(req, res) {
  var alternativeIdea = {
    name          : req.body.alternativeName,
    failureReason : req.body.failureReason,
    description   : req.body.description,
    differsBy     : req.body.differsBy

  };

  IdeaSeed.update(
    { _id : req.session.idea },
    { $push : { alternatives : alternativeIdea }},
    function(err, raw){
      console.log('The raw response from Mongo was ', raw);
    }
  );

  Account.findById( req.user.id,
    function (err, account) {
        account.einsteinPoints = account.einsteinPoints + 5;
        account.save(function (err) {
      });
  });
  res.redirect('/alternative-ideas');

});

////////////////////////////////////////////////
// Add a problem to an idea seed
////////////////////////////////////////////////
router.post('/add-idea-problem', function(req, res) {
  var newProblem = {
    text          : req.body.problemStatement,
    date          : new Date(),
    creator       : req.user.username,
    problemArea   : req.body.problemArea,
    ideaSeed      : req.session.idea
  };

  IdeaProblem.create( newProblem,
    function (err, problem) {
      if (err) return handleError(err);
      IdeaSeed.update(
        { _id : req.session.idea },
        { $push : { problemPriorities : {$each : [problem.id], $position : 0} }},
        function(err, raw){
          console.log('The raw response from Mongo was ', raw);
        }
      );
    }
  );
  res.sendStatus(200);
});

////////////////////////////////////////////////
// Add a component to an idea seed
////////////////////////////////////////////////
router.post('/add-idea-component', function(req, res) {
  
  Component.count({"ideaSeed" : req.session.idea}, function(err, count){

    var newCompNumber = count + 1;
    var newComponent = {
      text          : req.body.componentName,
      creator       : req.user.username,
      description   : req.body.componentDescription,
      ideaSeed      : req.session.idea,
      number        : newCompNumber
    };
      
    Component.create( newComponent ,
      function (err) {
        if (err) return handleError(err);
      }
    );
    res.json(newComponent);
  });
});


module.exports = router;
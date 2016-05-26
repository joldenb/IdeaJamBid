var express = require('express');
var passport = require('passport');
var mongoose = require('mongoose');
var _ = require('underscore');
var IdeaSeed = require('../models/ideaSeed');
var Component = require('../models/component');
var IdeaImage = require('../models/ideaImage');
var IdeaReview = require('../models/ideaReviews');
var IdeaProblem = require('../models/ideaProblem');
var Account = require('../models/account');
var router = express.Router();
var multer = require('multer');


var storage = multer.memoryStorage();
var uploading = multer({
  storage: storage,
  dest: '../uploads/'
});


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
router.post('/add-component-image', uploading.single('picture'), function(req, res) {
  
  IdeaImage.find({"filename" : {$regex : ".*"+req.file.originalname+".*"}}, function(err, images){

    var newFileName = req.file.originalname + "-" + (images.length + 1).toString();

    var image = new IdeaImage({ image : req.file.buffer, imageMimetype : req.file.mimetype,
      filename : newFileName, uploader : req.user.username });
    image.save(function(err, newImage){
      if (err) {
        console.log(err);
      } else {
        Component.update({"text" : req.body.imageComponent},
          { "mainImage" : newImage.id }, function(err, component){
            if (err) {
              console.log(err);
            } else {
              res.redirect('/idea-summary');
            }
          });

      }
    });

  }); //end of idea image query
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
      descriptions   : [req.body.componentDescription],
      ideaSeed      : req.session.idea,
      number        : newCompNumber,
      identifier    : "comp-"+Date.now()
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
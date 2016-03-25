var express = require('express');
var passport = require('passport');
var mongoose = require('mongoose');
var _ = require('underscore');
var IdeaSeed = require('../models/ideaSeed');
var Account = require('../models/account');
var router = express.Router();
var multer = require('multer');


var storage = multer.memoryStorage();
var uploading = multer({
  storage: storage,
  dest: '../uploads/'
});

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
      einsteinPoints: 0, rupees: 0, ideaSeeds: [] }), req.body.password, function(err, account) {
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
      if(req.user.ideaSeeds && req.user.ideaSeeds.length > 0){
        var ideaNames = [];
        _.each(req.user.ideaSeeds, function(element, index, list){

          IdeaSeed.findById(element._id, function(error, document){
            ideaNames.push(document.name);
            if(ideaNames.length == req.user.ideaSeeds.length){
              res.render('pages/begin', {
                user : req.user,
                accountIdeaSeeds : ideaNames
              });
            }
          });

        });

      }
/*      if(req.user.ideaSeeds && req.user.ideaSeeds.length > 0){
        Account.findById(req.user.id)
          .populate('ideaSeeds')
          .exec(function(err, account){
            var ideaNames = _.map(account.ideaSeeds, function(idea){return idea.name;});
            res.render('pages/begin', {
              user : req.user,
              accountIdeaSeeds : ideaNames
            });
          }); 
      } */
      else {
        res.render('pages/begin', {
          user : req.user
        });
      }

    } else {
      res.redirect('/');
    }
});

router.get('/introduce-idea', function(req, res) {
    if(req.user){
      var newIdea = new IdeaSeed({});
      newIdea.save();
      Account.update(
        { _id : req.user.id },
        { $push : { ideaSeeds : newIdea }},
        function(err, raw){
          console.log('The raw response from Mongo was ', raw);
        }
      );
      req.session.idea = newIdea._doc._id.toHexString();
      res.render('pages/introduce-idea', { user : req.user, idea : req.session.idea });

/*
        Account.update( {_id: req.user.id} ,
          {$push : {"ideaSeeds" : newIdea}},
          function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
            req.session.idea = newIdea._doc._id.toHexString();
            res.render('pages/introduce-idea', { user : req.user, idea : req.session.idea });
          }
        );*/
      //});
    } else {
      res.redirect('/');
    }
});

router.post('/introduce-idea', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {problem : req.body.purposeFor},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/accomplish');
});

router.get('/accomplish', function(req, res) {
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/accomplish', { user : req.user, idea : currentIdea });
  });
});

router.post('/accomplish', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {description : req.body.purposeHow},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/title-your-invention');
});

router.post('/suggestion-submit', function(req, res) {
    var newSuggestion = {
      suggestion : req.body.suggestion,
      hindsight : req.body.hindsight,
      foresight : req.body.foresight,
      outsight : req.body.outsight,
      category : req.body.suggestionCategory,
      contributor : req.user.id,
      problemType : req.body.problemType
    };
    Account.findById( req.user.id,
      function (err, account) {
        var points = parseInt(req.body.pointValue.slice(1));
        account.einsteinPoints = account.einsteinPoints + points;
        account.save(function (err) {});
    });

    IdeaSeed.update(
      { _id : req.session.idea },
      { $push : { suggestions : newSuggestion }},
      function(err, raw){
        console.log('The raw response from Mongo was ', raw);
        req.session.problemType = req.body.problemType;
        res.redirect('/suggestion-summary');
      }
    );
});

router.get('/update-suggestion-points/:problem', function(req, res){
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    var listOfProblems = IdeaSeed.getListOfProblems(currentIdea);
    var categorizedSuggestions = IdeaSeed.getCategorizedSuggestions(currentIdea, req.params.problem);
    var categoryPointValues = IdeaSeed.getCategoryPointValues(categorizedSuggestions);

    res.json(categoryPointValues);
  });
});

router.get('/update-suggestion-list/:problem', function(req, res){
  req.session.problemType = req.params.problem;
  res.sendStatus(200);
});



router.get('/title-your-invention', function(req, res) {
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/title-your-invention', { user : req.user, idea : currentIdea });
  });
});

router.post('/title-your-invention', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {name : req.body.inventionName},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/image-upload');
});

router.get('/problem-solver', function(req, res){
  res.render('pages/problem-solver', { user : req.user, idea : req.session.idea });
});

router.post('/problem-solver', function(req, res) {
  IdeaSeed.update({_id : req.session.idea}, {problem : req.body.problemToSolve},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/image-upload');
});

router.get('/image-upload', function(req, res){
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/image-upload', { user : req.user, idea : currentIdea });
  });
});

router.post('/image-upload', uploading.single('picture'), function(req, res) {
  if( req.file){
    IdeaSeed.update({_id : req.session.idea}, {image : req.file.buffer,
      imageMimetype : req.file.mimetype},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  }
  res.redirect('/idea-seed-summary');
});

router.get('/suggestion-summary', function(req, res){
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    var listOfProblems = IdeaSeed.getListOfProblems(currentIdea);
    var categorizedSuggestions;
    if(req.session.problemType){
      categorizedSuggestions = IdeaSeed.getCategorizedSuggestions(currentIdea, req.session.problemType);
    } else {
      categorizedSuggestions = IdeaSeed.getCategorizedSuggestions(currentIdea, listOfProblems[0][0]);
    }
    var categoryPointValues = IdeaSeed.getCategoryPointValues(categorizedSuggestions);

    res.render('pages/suggestion-summary', { user : req.user, idea : currentIdea,
      problems : listOfProblems, categoryPoints : categoryPointValues,
      problemType : req.session.problemType });
  });
});

router.get('/view-idea-suggestions', function(req, res){
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    var listOfProblems = IdeaSeed.getListOfProblems(currentIdea);
    var categorizedSuggestions;
    if(req.session.problemType){
      categorizedSuggestions = IdeaSeed.getCategorizedSuggestions(currentIdea, req.session.problemType);
    } else {
      categorizedSuggestions = IdeaSeed.getCategorizedSuggestions(currentIdea, listOfProblems[0][0]);
    }

    categorizedSuggestions = IdeaSeed.getCategoryDisplayNames(categorizedSuggestions);
    
    res.render('pages/view-idea-suggestions', { user : req.user, idea : currentIdea,
      problems : listOfProblems, categorizedSuggestions : categorizedSuggestions,
      problemType : req.session.problemType });
  });
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
  var currentIdea,
    imageURL = "";
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    if(currentIdea.image){
      imageURL = "data:"+currentIdea.imageMimetype+";base64,"+ currentIdea.image.toString('base64');
    }
    res.render('pages/idea-seed-summary', { user : req.user, idea : currentIdea,
      imgURL : imageURL });
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

router.get('/idea-summary/:ideaName', function(req, res){
  IdeaSeed.findOne({ "name" : req.params.ideaName },function(err, idea){
    req.session.idea = idea._doc._id.toHexString();
    res.redirect('/idea-summary');
  });
});

router.get('/idea-summary', function(req, res){
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/idea-summary', { user : req.user, idea : currentIdea });
  });
});

router.get('/create-application', function(req, res){
  var currentAccount;
  Account.findById( req.user.id,
    function (err, account) {
      currentAccount = account._doc;
      IdeaSeed.findById(req.session.idea,function(err, idea){
        currentIdea = idea._doc;
        IdeaSeed.createApplication(currentIdea, currentAccount, res);
      });
  });
});

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

module.exports = router;
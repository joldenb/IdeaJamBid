var express = require('express');
var passport = require('passport');
var mongoose = require('mongoose');
var _ = require('underscore');
var IdeaImage = require('../models/ideaImage');
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
      if (req.session.idea){
        req.session.idea = null;
      }
      if(req.user.ideaSeeds && req.user.ideaSeeds.length > 0){
        var ideaNames = [],
            j = 0;
        _.each(req.user.ideaSeeds, function(element, index, list){
            IdeaSeed.findById(element._id, function(error, document){
              j++;
              if(document){
                ideaNames.push(document.name);
                if(j == req.user.ideaSeeds.length){
                  return res.render('pages/begin', {
                    user : req.user,
                    accountIdeaSeeds : ideaNames
                  });
                }
              } else {
                if(j == req.user.ideaSeeds.length){
                  return res.render('pages/begin', {
                    user : req.user,
                    accountIdeaSeeds : ideaNames
                  });
                }

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
        return res.render('pages/begin', {
          user : req.user,
          accountIdeaSeeds : []
        });
      }

    } else {
      res.redirect('/');
    }
});

router.get('/introduce-idea', function(req, res) {
    if(req.user){
      if(!req.session.idea) {
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
        IdeaSeed.findById(req.session.idea,function(err, idea){
          currentIdea = idea._doc;
          res.render('pages/introduce-idea', { user : req.user, idea : currentIdea });
        });
      }
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
    var newSuggId = IdeaSeed.generateSuggID(req.body.suggestion);
    var newSuggestion = {
      suggestionID : newSuggId,
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
    var imageURLs = [];
    currentIdea = idea._doc;
    if (idea._doc.images.length != 0){
      for (var i =0; i < idea._doc.images.length; i++){
        var j = 0;
        IdeaImage.findOne({"_id" : idea._doc.images[i]}, function(err, image){
          j++;
          if(image && image._doc && image._doc.image){
            var filename = image._doc["filename"];
            imageURLs.push([
              filename,
              "data:"+image._doc["imageMimetype"]+";base64,"+ image._doc["image"].toString('base64')
            ]);
          }
          if (j == idea._doc.images.length){
            res.render('pages/image-upload', { user : req.user, idea : currentIdea, imageURLs : imageURLs });
          }
        });
      }
    } else {
      res.render('pages/image-upload', { user : req.user, idea : currentIdea, imageURLs : [] });
    }
  });
});

router.post('/image-upload', uploading.single('picture'), function(req, res) {
    var image = new IdeaImage({ image : req.file.buffer, imageMimetype : req.file.mimetype, 
      filename : req.file.originalname });
    image.save(function(err, newImage){
      if (err) {
        console.log(err);
      } else {
        IdeaSeed.update(
            { _id : req.session.idea },
            { $push : { images : newImage.id }},
            function(err, raw){
              console.log('The raw response from Mongo was ', raw);
              res.redirect('/image-upload');
            }
        );
      }
    });

});

router.get('/annotate-image/:image', function(req, res){
  IdeaImage.findOne({"filename": req.params.image} ,function(err, image){
    currentImage = image._doc;
    var annotations = [];
    if(currentImage.image){
      imageURL = "data:"+currentImage.imageMimetype+";base64," + currentImage.image.toString('base64');
      for(var i=0; i < currentImage.annotations.length; i++){
        annotations.push( {
            src : imageURL,
            text : currentImage.annotations[i].text,
            shapes : [{
                type : 'rect',
                geometry : { 
                  x : currentImage.annotations[i].xCoord,
                  y: currentImage.annotations[i].yCoord,
                  width : currentImage.annotations[i].width,
                  height: currentImage.annotations[i].height }
            }]
        });
      }
      res.render('pages/annotate-image', { 
        user : req.user,
        imgURL : imageURL,
        imageName : currentImage.filename,
        annotations : JSON.stringify(annotations)
      });
    } else {
      res.redirect('/idea-seed-summary');
    }
  });
});

router.post('/save-annotations', function(req, res){
  var newAnno = {},
      i = 0;

  var annotations = req.body;

  IdeaImage.update({"filename" : req.body.imageName}, { $set : { annotations : [] }} , {multi:true});
  
  while ( annotations["annotations[" + i + "][src]"] ) {
    newAnno["text"] = annotations["annotations[" + i + "][text]"];
    newAnno["xCoord"] = annotations["annotations[" + i + "][shapes][0][geometry][x]"];
    newAnno["yCoord"] = annotations["annotations[" + i + "][shapes][0][geometry][y]"];
    newAnno["width"] = annotations["annotations[" + i + "][shapes][0][geometry][width]"];
    newAnno["height"] = annotations["annotations[" + i + "][shapes][0][geometry][height]"];
    IdeaImage.update(
        { "filename" : req.body.imageName },
        { $push : { annotations : newAnno }},
        function(err, raw){
          console.log('The raw response from Mongo was ', raw);
        }
    );
    i++;
  }

});

router.get('/suggestion-summary', function(req, res){
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    var listOfProblems = IdeaSeed.getListOfProblems(currentIdea);
    var categorizedSuggestions = {};
    if(req.session.problemType){
      categorizedSuggestions = IdeaSeed.getCategorizedSuggestions(currentIdea, req.session.problemType);
    } else if ( listOfProblems.length > 0 ){
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
    var listOfProblems = IdeaSeed.getListOfProblems(currentIdea) || [];
    var categorizedSuggestions = {};
    categorizedSuggestions = IdeaSeed.getCategorizedSuggestions(currentIdea);
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

router.post('/incorporate-suggestions', function(req, res) {
  IdeaSeed.findById(req.session.idea, function(err, idea){
    currentIdea = idea._doc;
    var newVariantName = "",
        incorporatedSuggestions = [],
        newVariant = {};

    newVariantName = IdeaSeed.generateVariantName(currentIdea.name);
    newVariant["name"] = newVariantName;

    for(var suggestion in req.body){
      if(req.body[suggestion] == "incorporate"){
        incorporatedSuggestions.push(suggestion);
      }
    }
    newVariant["suggestions"] = incorporatedSuggestions;

    currentIdea.variants.push(newVariant);
    idea.save(function(data){
      res.redirect('/idea-summary');
    });

  });
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
    req.session.idea = null;
    req.logout();
    res.redirect('/');
});

router.get('/clear-session-idea', function(req, res){
  if(req.session.idea){
    req.session.idea = null;
    req.session.save();
  }
});

module.exports = router;
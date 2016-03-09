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
  IdeaSeed.update({_id : req.session.idea}, {purposeFor : req.body.purposeFor, purposeHow : req.body.purposeHow},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/title-your-invention');
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
  res.redirect('/problem-solver');
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
  res.render('pages/image-upload', { user : req.user, idea : req.session.idea });
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
  if(req.body.perfSliderOneValue){
    IdeaSeed.update({_id : req.session.idea}, {performOne : req.body.perfSliderOneValue,
      performProblem : req.body.performProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  } else {
    IdeaSeed.update({_id : req.session.idea}, {performProblem : req.body.performProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  }
  Account.findById( req.user.id,
    function (err, account) {
      account.einsteinPoints = account.einsteinPoints + 5;
      account.save(function (err) {
      });
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
  if(req.body.affordSliderOneValue){
    IdeaSeed.update({_id : req.session.idea}, {affordOne : req.body.affordSliderOneValue,
      affordProblem : req.body.affordProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  } else {
    IdeaSeed.update({_id : req.session.idea}, {affordProblem : req.body.affordProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  }
  Account.findById( req.user.id,
    function (err, account) {
      account.einsteinPoints = account.einsteinPoints + 5;
      account.save(function (err) {
      });
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
  if(req.body.featureSliderOneValue){
    IdeaSeed.update({_id : req.session.idea}, {featureOne : req.body.featureSliderOneValue,
      featureProblem : req.body.featureProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  } else {
    IdeaSeed.update({_id : req.session.idea}, {featureProblem : req.body.featureProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  }
  Account.findById( req.user.id,
    function (err, account) {
      account.einsteinPoints = account.einsteinPoints + 5;
      account.save(function (err) {
      });
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
  if(req.body.deliverSliderOneValue){
    IdeaSeed.update({_id : req.session.idea}, {deliverOne : req.body.deliverSliderOneValue,
      deliverProblem : req.body.deliverProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  } else {
    IdeaSeed.update({_id : req.session.idea}, {deliverProblem : req.body.deliverProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  }
  Account.findById( req.user.id,
    function (err, account) {
      account.einsteinPoints = account.einsteinPoints + 5;
      account.save(function (err) {
      });
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
  if(req.body.useabilitySliderOneValue){
    IdeaSeed.update({_id : req.session.idea}, {useabilityOne : req.body.useabilitySliderOneValue,
      useabilityProblem : req.body.useabilityProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  } else {
    IdeaSeed.update({_id : req.session.idea}, {useabilityProblem : req.body.useabilityProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  }
  Account.findById( req.user.id,
    function (err, account) {
      account.einsteinPoints = account.einsteinPoints + 5;
      account.save(function (err) {
      });
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
  if (req.body.maintainSliderOneValue){
    IdeaSeed.update({_id : req.session.idea}, {maintainOne : req.body.maintainSliderOneValue,
      maintainProblem : req.body.maintainProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  } else {
    IdeaSeed.update({_id : req.session.idea}, {maintainProblem : req.body.maintainProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  }
  Account.findById( req.user.id,
    function (err, account) {
      account.einsteinPoints = account.einsteinPoints + 5;
      account.save(function (err) {
      });
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
  if(req.body.durabilitySliderOneValue){
    IdeaSeed.update({_id : req.session.idea}, {durabilityOne : req.body.durabilitySliderOneValue,
      durabilityProblem : req.body.durabilityProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  } else {
    IdeaSeed.update({_id : req.session.idea}, {durabilityProblem : req.body.durabilityProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  }
  Account.findById( req.user.id,
    function (err, account) {
      account.einsteinPoints = account.einsteinPoints + 5;
      account.save(function (err) {
      });
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
  if(req.body.imageSliderOneValue){
    IdeaSeed.update({_id : req.session.idea}, {imageOne : req.body.imageSliderOneValue,
      imageProblem : req.body.imageProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  } else {
    IdeaSeed.update({_id : req.session.idea}, {imageProblem : req.body.imageProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  }
  Account.findById( req.user.id,
    function (err, account) {
      account.einsteinPoints = account.einsteinPoints + 5;
      account.save(function (err) {
      });
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
  if(req.body.complexSliderOneValue){
    IdeaSeed.update({_id : req.session.idea}, {complexOne : req.body.complexSliderOneValue,
      complexProblem : req.body.complexProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  } else {
    IdeaSeed.update({_id : req.session.idea}, {complexProblem : req.body.complexProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  }
  Account.findById( req.user.id,
    function (err, account) {
      account.einsteinPoints = account.einsteinPoints + 5;
      account.save(function (err) {
      });
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
  if(req.body.precisionSliderOneValue){
    IdeaSeed.update({_id : req.session.idea}, {precisionOne : req.body.precisionSliderOneValue,
      precisionProblem : req.body.precisionProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  } else {
    IdeaSeed.update({_id : req.session.idea}, {precisionProblem : req.body.precisionProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  }
  Account.findById( req.user.id,
    function (err, account) {
      account.einsteinPoints = account.einsteinPoints + 5;
      account.save(function (err) {
      });
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
  if(req.body.variabilitySliderOneValue){
    IdeaSeed.update({_id : req.session.idea}, {variabilityOne : req.body.variabilitySliderOneValue,
      variabilityProblem : req.body.variabilityProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  } else {
    IdeaSeed.update({_id : req.session.idea}, {variabilityProblem : req.body.variabilityProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  }
  Account.findById( req.user.id,
    function (err, account) {
      account.einsteinPoints = account.einsteinPoints + 5;
      account.save(function (err) {
      });
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
  if(req.body.sensitivitySliderOneValue){
    IdeaSeed.update({_id : req.session.idea}, {sensitivityOne : req.body.sensitivitySliderOneValue,
      sensitivityProblem : req.body.sensitivityProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  } else {
    IdeaSeed.update({_id : req.session.idea}, {sensitivityProblem : req.body.sensitivityProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  }
  Account.findById( req.user.id,
    function (err, account) {
      account.einsteinPoints = account.einsteinPoints + 5;
      account.save(function (err) {
      });
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
  if(req.body.immatureSliderOneValue){
    IdeaSeed.update({_id : req.session.idea}, {immatureOne : req.body.immatureSliderOneValue,
      immatureProblem : req.body.immatureProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  } else {
    IdeaSeed.update({_id : req.session.idea}, {immatureProblem : req.body.immatureProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  }
  Account.findById( req.user.id,
    function (err, account) {
      account.einsteinPoints = account.einsteinPoints + 5;
      account.save(function (err) {
      });
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
  if(req.body.dangerSliderOneValue){
    IdeaSeed.update({_id : req.session.idea}, {dangerOne : req.body.dangerSliderOneValue,
      dangerProblem : req.body.dangerProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  } else {
    IdeaSeed.update({_id : req.session.idea}, {dangerProblem : req.body.dangerProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  }
  Account.findById( req.user.id,
    function (err, account) {
      account.einsteinPoints = account.einsteinPoints + 5;
      account.save(function (err) {
      });
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
  if(req.body.skillsSliderOneValue){
    IdeaSeed.update({_id : req.session.idea}, {skillsOne : req.body.skillsSliderOneValue,
      skillsProblem : req.body.skillsProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  } else {
    IdeaSeed.update({_id : req.session.idea}, {skillsProblem : req.body.skillsProblem},
      { multi: false }, function (err, raw) {
        console.log('The raw response from Mongo was ', raw);
    });
  }
  Account.findById( req.user.id,
    function (err, account) {
      account.einsteinPoints = account.einsteinPoints + 5;
      account.save(function (err) {
      });
  });
  res.redirect('/suggestion-summary');
});

router.get('/suggestion-summary', function(req, res){
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/suggestion-summary', { user : req.user, idea : currentIdea });
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

router.get('/idea-summary', function(req, res){
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/idea-summary', { user : req.user, idea : currentIdea });
  });
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

router.get('/auth/google/callback',
  passport.authenticate('google',{
    successRedirect: '/begin',
    failureRedirect: '/'
}));

// =====================================
// Facebook ROUTES =====================
// =====================================
// send to google to do the authentication
// profile gets us their basic information including their name
// email gets their emails
router.get('/auth/facebook', passport.authenticate('facebook', { scope:  'email' }));

router.get('/auth/facebook/callback',
  passport.authenticate('facebook',{
    successRedirect: '/begin',
    failureRedirect: '/'
}));

// =====================================
// LinkedIn ROUTES =====================
// =====================================
// send to google to do the authentication
// profile gets us their basic information including their name
// email gets their emails
router.get('/auth/linkedin', passport.authenticate('linkedin'));

router.get('/auth/linkedin/callback', 
  passport.authenticate('linkedin',{
    successRedirect: '/begin',
    failureRedirect: '/'
}));



module.exports = router;
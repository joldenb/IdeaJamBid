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
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var ideaSeedHelpers = require('../helpers/idea-seed-helpers');


var storage = multer.memoryStorage();
var uploading = multer({
  storage: storage,
  dest: '../uploads/'
});

var today;

////////////////////////////////////////////////
// Add a problem to an idea seed
////////////////////////////////////////////////
router.post('/add-idea-problem', csrfProtection, function(req, res) {
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }
  var newProblem = {
    text          : req.body.problemStatement,
    date          : new Date(),
    creator       : req.user.username,
    problemArea   : req.body.problemArea,
    ideaSeed      : req.session.idea,
    identifier    : "prob-"+Date.now()
  };

  IdeaProblem.create( newProblem,
    function (err, problem) {
      res.json({
        problemIdentifier : problem.identifier
      });
      if (err) return handleError(err);
      IdeaSeed.update(
        { _id : req.session.idea },
        { $push : { problemPriorities : {$each : [problem.id], $position : 0} }},
        function(err, raw){
          Account.findById( req.user.id,
            function (err, account) {
              account.einsteinPoints = account.einsteinPoints + 15;
              today = ideaSeedHelpers.getCurrentDate();
              if(account.einsteinHistory){
                account.einsteinHistory.push("You earned 15 Einstein Points on " + today + " by adding an imperfection to an idea.");
              } else {
                account.einsteinHistory = ["You earned 15 Einstein Points on " + today + " by adding an imperfection to an idea."];
              }
              account.save(function (err) {});
          });

          console.log('The raw response from Mongo was ', raw);
        }
      );
    }
  );
});

////////////////////////////////////////////////
// Add a component to an idea seed
////////////////////////////////////////////////
router.post('/add-component-image', csrfProtection, function(req, res) {
  
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  var newFileName = req.body.filename + Date.now();

  var image = { imageMimetype : req.body.type,
    filename : newFileName, uploader : req.user.username, amazonURL : req.body.fileUrl };

  if(req.body["exif[Orientation]"]){
    image.orientation = parseInt(req.body["exif[Orientation]"]);
  }

  Component.update({"identifier" : req.body.imageComponent},
    { "mainImage" : image }, function(err, component){
      if (err) {
        console.log(err);
      } else {
        if(req.body.componentProfilePage ){
          res.json({"redirectURL" : '/component-profile/'+req.body.imageComponent});
        } else if(req.body.suggestionPage ){
          res.json({"imageURL" : req.body.fileUrl});
        } else {
          // I need to figure out how this should behave. The form is not being submitted
          // correctly
          res.json({"redirectURL" : '/inventor-idea-summary'});
        }
      }
  });
});


////////////////////////////////////////////////
// Add a component to an idea seed
////////////////////////////////////////////////
router.post('/add-idea-component', csrfProtection, function(req, res) {
  
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }
  var parentCompTitle;

  Component.count({"ideaSeed" : req.session.idea}, function(err, count){

    var newCompNumber = count + 1;
    var newComponent = {
      text          : req.body.componentName,
      creator       : req.user.username,
      ideaSeed      : req.session.idea,
      number        : newCompNumber,
      identifier    : "comp-"+Date.now()
    };

    if (req.body.componentDescription){
      newComponent['descriptions'] = [req.body.componentDescription];
    }

    //assumes the req.body.componentParent is the identifier of the selected Parent component
    if(req.body.subComponent && req.body.componentParent){
      Component.findOne({"identifier" : req.body.componentParent}, function(err, parentComponent){
        if(parentComponent){
          //add related component to this component
          parentCompTitle = parentComponent.text || parentComponent.descriptions[0] || "No parent component title"
          newComponent.relatedComps = [{
            compID : parentComponent.id,
            relationship: req.body.componentName + " is a sub-component of " + parentCompTitle + ".",
            subComponent : "sub-component"
          }];

          Component.create( newComponent ,
            function (err, newCompDocument) {
              if (err) return handleError(err);

              // add new component document to parent Component's related comps list
              if(parentComponent.relatedComps){
                parentComponent.relatedComps.push({
                  compID : newCompDocument._doc._id,
                  relationship: req.body.componentName + " is a sub-component of " + parentCompTitle + ".",
                  subComponent : "parent"
                });
              } else {
                parentComponent.relatedComps = [{
                  compID : newCompDocument._doc._id,
                  relationship: req.body.componentName + " is a sub-component of " + parentCompTitle + ".",
                  subComponent : "parent"
                }];
              }
              parentComponent.save(function(err){
                if (err) return handleError(err);
                Account.findById( req.user.id,
                  function (err, account) {
                    account.einsteinPoints = account.einsteinPoints + 10;
                    today = ideaSeedHelpers.getCurrentDate();
                    if(account.einsteinHistory){
                      account.einsteinHistory.push("You earned 10 Einstein Points on " + today + " by adding a component to an idea.");
                    } else {
                      account.einsteinHistory = ["You earned 10 Einstein Points on " + today + " by adding a component to an idea."];
                    }
                    account.save(function (err) {});
                });


                res.json(newComponent);
              });
            }
          );
        }
      });
    } else {
      Component.create( newComponent ,
        function (err) {
          if (err) return handleError(err);
          Account.findById( req.user.id,
            function (err, account) {
              account.einsteinPoints = account.einsteinPoints + 10;
              today = ideaSeedHelpers.getCurrentDate();
              if(account.einsteinHistory){
                account.einsteinHistory.push("You earned 10 Einstein Points on " + today + " by adding a component to an idea.");
              } else {
                account.einsteinHistory = ["You earned 10 Einstein Points on " + today + " by adding a component to an idea."];
              }
              account.save(function (err) {});
          });
          res.json(newComponent);
        }
      );

    }
      
  });

});

////////////////////////////////////////////////
// Add a profile headshot
////////////////////////////////////////////////
router.post('/add-profile-headshot', csrfProtection,  function(req, res) {
  
  if(!req.user){
    res.redirect('/');
  } else {
    
    Account.findById( req.user.id,
      function (err, account) {
      if(err || !account){
        res.redirect('/');
        return;
      }  
      account.headshots.unshift({
        filename : req.body.filename + Date.now(),
        imageMimetype : req.body.type,
        amazonURL : req.body.fileUrl,
        uploader : req.user.username
      });

      if(req.body["exif[Orientation]"]){
        account.headshots[0].orientation = parseInt(req.body["exif[Orientation]"]);
      }

      account.save(function (err) {
        res.sendStatus(200);
        return;
      });
    });
  }
});

////////////////////////////////////////////////
// Resetting profile picture
////////////////////////////////////////////////
router.post('/set-existing-profile-pic', csrfProtection, function(req, res) {
  
  if(!req.user){
    res.redirect('/');
  } else {
    Account.findById( req.user.id, function(err, account){
      IdeaImage.find({"filename" : req.body.newPictureFilename}, function(err, image){
        if(image){
          var index = account.headshots.indexOf(image[0].id);
          if (index > -1) {
            account.headshots.splice(index, 1);
            account.headshots.unshift(image[0].id);
            account.save(function(err){
              res.sendStatus(200);
            });
          }
        }
      });
    });
  }
});

////////////////////////////////////////////////
// Add a description to a component
////////////////////////////////////////////////
router.post('/add-description', csrfProtection, function(req, res) {

  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

    Component.findOne({"identifier" : req.body["component-identifier"]}, function(err, component){
      if(err){
        res.json({error: err});
      }

      if(component){
        if( req.body.description!=="" ){
          //check if there's a period at the end
          if(req.body.description.slice(req.body.description.length - 1) == "."){
            req.body.description = req.body.description.slice(0, -1);
          }
          component.descriptions.push(req.body.description);
        }
        component.save(function(err){
          res.sendStatus(200);
        });
      } else {
        res.sendStatus(409);
      }
    });
});

////////////////////////////////////////////////
// Add a dimension to a component
////////////////////////////////////////////////
router.post('/add-dimension', csrfProtection, function(req, res) {

  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

    Component.findOne({"identifier" : req.body["component-identifier"]}, function(err, component){
      if(err){
        res.json({error: err});
      }

      if(component){
        if( req.body.dimension!=="" ){
          component.dimensions.push(req.body.dimension);
        }
        component.save(function(err){
          res.sendStatus(200);
        });
      } else {
        res.sendStatus(409);
      }
    });
});

////////////////////////////////////////////////
// Add a material to a component
////////////////////////////////////////////////
router.post('/add-material', csrfProtection, function(req, res) {

  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

    Component.findOne({"identifier" : req.body["component-identifier"]}, function(err, component){
      if(err){
        res.json({error: err});
      }

      if(component){
        if( req.body.material!=="" ){
          component.materials.push(req.body.material);
        }
        component.save(function(err){
          res.sendStatus(200);
        });
      } else {
        res.sendStatus(409);
      }
    });
});


module.exports = router;
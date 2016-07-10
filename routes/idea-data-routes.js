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
router.post('/add-component-image', function(req, res) {
  
  IdeaImage.find({"filename" : {$regex : ".*"+req.body.filename+".*"}}, function(err, images){

    var newFileName = req.body.filename + "-" + (images.length + 1).toString();

    var image = new IdeaImage({ imageMimetype : req.body.type,
      filename : newFileName, uploader : req.user.username, amazonURL : req.body.fileUrl });
    image.save(function(err, newImage){
      if (err) {
        console.log(err);
      } else {
        Component.update({"identifier" : req.body.imageComponent},
          { "mainImage" : newImage.id }, function(err, component){
            if (err) {
              console.log(err);
            } else {
              if(req.body.componentProfilePage ){
                res.json({"redirectURL" : '/component-profile/'+req.body.imageComponent});
              } else {
                res.json({"redirectURL" : '/idea-summary'});
              }
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

////////////////////////////////////////////////
// Add a profile headshot
////////////////////////////////////////////////
router.post('/add-profile-headshot',  function(req, res) {
  
  if(!req.user){
    res.redirect('/');
  } else {
    
    IdeaImage.find({"filename" : {$regex : ".*"+req.body.filename+".*"}}, function(err, images){

      var newFileName = req.body.filename + "-" + (images.length + 1).toString();

      var image = new IdeaImage({ imageMimetype : req.body.type,
        filename : newFileName, uploader : req.user.username, amazonURL : req.body.fileUrl });

      if(req.body["exif[Orientation]"]){
        image.orientation = parseInt(req.body["exif[Orientation]"]);
      }
      
      image.save(function(err, newImage){
        if (err) {
          console.log(err);
        } else {
          Account.findById( req.user.id,
            function (err, account) {
              if(account.headshots){
                account.headshots.unshift(newImage.id);
              } else {
                account.headshots = [newImage.id];
              }
              account.save(function (err) {
                res.redirect('/profile-picture');
              });
          });
        }
      });

    }); //end of idea image query
  }
});

////////////////////////////////////////////////
// Resetting profile picture
////////////////////////////////////////////////
router.post('/set-existing-profile-pic', function(req, res) {
  
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
router.post('/add-description', function(req, res) {


    Component.findOne({"identifier" : req.body["component-identifier"]}, function(err, component){
      if(err){
        res.json({error: err});
      }

      if(component){
        if( req.body.description!=="" ){
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


module.exports = router;
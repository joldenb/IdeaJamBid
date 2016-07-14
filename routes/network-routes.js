var express = require('express');
var passport = require('passport');
var mongoose = require('mongoose');
var _ = require('underscore');
var ObjectId = mongoose.Schema.Types.ObjectId;
var aws = require('aws-sdk');
var env = require('node-env-file');
var IdeaImage = require('../models/ideaImage');
var Aptitude = require('../models/aptitude');
var IdeaReview = require('../models/ideaReviews');
var IdeaSeed = require('../models/ideaSeed');
var Component = require('../models/component');
var Network = require('../models/network');
var IdeaProblem = require('../models/ideaProblem');
var Account = require('../models/account');
var router = express.Router();
var multer = require('multer');
var fs = require('fs');


var S3_BUCKET = process.env.S3_BUCKET;

var storage = multer.memoryStorage();
var uploading = multer({
  storage: storage,
  dest: '../uploads/'
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for saving a school
******************************************************************
******************************************************************
*****************************************************************/
router.post('/save-school-network', function(req, res) {
  Network.findOne({"name" : req.body.schoolNetwork}, function(err, schoolNetwork){
      if(err){
        res.json({error: err});
      }

      if(schoolNetwork){
        Account.findById( req.user.id,
          function (err, account) {
            account.networks['school'] = schoolNetwork.id;
            account.save(function (err) {});
        });
        res.redirect('/begin');
      } else {
        var newSchool = new Network({
          name : req.body.schoolNetwork,
          type : 'school',
        });
        newSchool.save(function(err, newSchool){
          Account.findById( req.user.id,
            function (err, account) {
              account.networks['school'] = newSchool.id;
              account.save(function (err) {});
          });
        });
        res.redirect('/begin');
      }
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for saving a company
******************************************************************
******************************************************************
*****************************************************************/
router.post('/save-company-network', function(req, res) {
  Network.findOne({"name" : req.body.companyNetwork}, function(err, companyNetwork){
      if(err){
        res.json({error: err});
      }

      if(companyNetwork){
        Account.findById( req.user.id,
          function (err, account) {
            account.networks['company'] = companyNetwork.id;
            account.save(function (err) {});
        });
        res.redirect('/begin');
      } else {
        var newCompany = new Network({
          name : req.body.companyNetwork,
          type : 'company',
        });
        newCompany.save(function(err, newCompany){
          Account.findById( req.user.id,
            function (err, account) {
              account.networks['company'] = newCompany.id;
              account.save(function (err) {});
          });
        });
        res.redirect('/begin');
      }
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for saving a profile location
******************************************************************
******************************************************************
*****************************************************************/
router.post('/save-location-network', function(req, res) {
  //need to add validation to make sure these both exist.
  var cityAndState = req.body.locationCity + ", " + req.body.locationState;
  Network.findOne({"name" : cityAndState}, function(err, locationNetwork){
      if(err){
        res.json({error: err});
      }

      if(locationNetwork){
        Account.findById( req.user.id,
          function (err, account) {
            account.networks['location'] = locationNetwork.id;
            account.save(function (err) {});
        });
        res.sendStatus(200);
      } else {
        var newLocation = new Network({
          name : cityAndState,
          type : 'location',
        });
        newLocation.save(function(err, newLocation){
          Account.findById( req.user.id,
            function (err, account) {
              account.networks['location'] = newLocation.id;
              account.save(function (err) {});
          });
        });
        res.sendStatus(200);
      }
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for saving a new aptitude
******************************************************************
******************************************************************
*****************************************************************/
router.post('/save-aptitude', function(req, res) {
  var aptitudeTitle = req.body.aptitudeTitle;
  Aptitude.find({"title" : aptitudeTitle}, function(err, existingAptitudes){
    if(err){
      res.json({error: err})
    }

    if(existingAptitudes.length > 0){
      Account.findById( req.user.id,
        function (err, account) {
          account.aptitudes.push(existingAptitudes[0].id); //use the first existing record
          account.save(function (err) {});
      });
      console.log
      res.sendStatus(200);
    } else {
      var newAptitude = new Aptitude({
        title : aptitudeTitle,
        identifier : "aptitude-"+Date.now()
      });
      newAptitude.save(function(err, newSavedAptitude){
        Account.findById( req.user.id,
          function (err, account) {
            account.aptitudes.push(newSavedAptitude.id);
            account.save(function (err) {});
        });
      });
      res.sendStatus(200);
    }
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for rendering the network profile page. Currently
* this applies to schools, companies, aptitutes, etc
******************************************************************
******************************************************************
*****************************************************************/
router.get('/networks/:networkName', function(req, res){
  IdeaImage.findById(req.user.headshots[0], function(err, headshot){
    if(headshot){
      var headshotURL = headshot["amazonURL"];
      var headshotStyle = "";
      switch (headshot["orientation"]) {
        case 1 :
          headshotStyle = "";
          break;
        case 2 :
          headshotStyle = "-webkit-transform: rotate(90deg);-moz-transform: rotate(90deg);-o-transform: rotate(90deg);-ms-transform: rotate(90deg);transform: rotate(90deg);";
          break;
        case 3 :
          headshotStyle = "-webkit-transform: rotate(180deg);-moz-transform: rotate(180deg);-o-transform: rotate(180deg);-ms-transform: rotate(180deg);transform: rotate(180deg);";
          break;
        case 4 :
          headshotStyle = "-webkit-transform: rotate(270deg);-moz-transform: rotate(270deg);-o-transform: rotate(270deg);-ms-transform: rotate(270deg);transform: rotate(270deg);";
          break;
      }
    }

    var networkName = req.params
      .networkName
      .split("-")
      .join(" ");

    Network.findOne({"name" : {$regex : ".*"+networkName+".*"}}, function(err, network){
      //if theres no matching name or logged in user
      if(!network || !req.user){
        return res.redirect('/');
      }

      Account.find({ $or : [

        {'networks.school' : network['id']},
        {'networks.company' : network['id']},
        {'networks.location' : network['id']}

      ]}).sort({einsteinPoints : -1})
      .limit(2)
      .exec(function(err, accounts){

        accountHeadshotIDs = {};
        for(var i = 0; i < accounts.length; i++){
          accountHeadshotIDs[accounts[i].username] = accounts[i].headshots[0];
        }

        IdeaImage.find({"_id" : {$in : _.values(accountHeadshotIDs)} } , function(err, images){

          /* basically doing a manual join of account headshot ids with the image model */
          var accountNameAndURLs = {};
          if(images.length > 0){
            for(var j = 0; j < images.length; j++){
              var accountName = _.invert(accountHeadshotIDs)[images[j]["id"]];
              if(accountName){
                var accountHeadshotStyle = "";
                switch (images[j]["orientation"]) {
                  case 1 :
                    accountHeadshotStyle = "";
                    break;
                  case 2 :
                    accountHeadshotStyle = "-webkit-transform: rotate(90deg);-moz-transform: rotate(90deg);-o-transform: rotate(90deg);-ms-transform: rotate(90deg);transform: rotate(90deg);";
                    break;
                  case 3 :
                    accountHeadshotStyle = "-webkit-transform: rotate(180deg);-moz-transform: rotate(180deg);-o-transform: rotate(180deg);-ms-transform: rotate(180deg);transform: rotate(180deg);";
                    break;
                  case 4 :
                    accountHeadshotStyle = "-webkit-transform: rotate(270deg);-moz-transform: rotate(270deg);-o-transform: rotate(270deg);-ms-transform: rotate(270deg);transform: rotate(270deg);";
                    break;
                }
                accountNameAndURLs[accountName] = [images[j]["amazonURL"], accountHeadshotStyle];
              }
            }
          }

          /* First, make a list of all the aptitude IDs for everyone, then query the database for them, 
          then figure out who has what aptitudes. */
          var listOfAllAptitudes = [];
          for(i = 0; i < accounts.length; i++){
            listOfAllAptitudes = listOfAllAptitudes.concat(accounts[i].aptitudes);
          }

          //get rid of repeats and undefineds
          listOfAllAptitudes = listOfAllAptitudes.filter(function(n){ return n != undefined });
          listOfAllAptitudes = _.uniq(listOfAllAptitudes);

          Aptitude.find({"_id" : { $in : listOfAllAptitudes}}, function(err, aptitudes){
            return res.render('pages/network-profile', {
              user : req.user,
              topInventors : accounts,
              inventorAptitudes :  aptitudes,
              accountNameAndURLs : accountNameAndURLs,
              networkName : network.name
            });
          })

          

        });


      });
    });



  });
});

module.exports = router;
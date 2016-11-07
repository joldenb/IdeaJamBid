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
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var ideaSeedHelpers = require('../helpers/idea-seed-helpers');
var addressparser = require('addressparser');

var S3_BUCKET = process.env.S3_BUCKET;

var storage = multer.memoryStorage();
var uploading = multer({
  storage: storage,
  dest: '../uploads/'
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for saving a general jam
******************************************************************
******************************************************************
*****************************************************************/
router.post('/accept-jam-member', csrfProtection, function(req, res) {

  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }
  
  req.body.jamName = req.body.jamName.trim();

  Network.findOne({"name" : req.body.jamName}, function(err, jam){
      if(err){
        res.json({error: err});
      }

      if(jam){
        Account.find( {"nickname" : req.body.acceptMember},
          function (err, accounts) {
            if(accounts.length > 0){
              //we need to figure out a way to do this without nicknames so we dont have to worry
              // about there being multiple
              account = accounts[0];
              if(account.pendingNetworks && account.pendingNetworks.length){
                account.pendingNetworks.splice(account.pendingNetworks.indexOf(jam.id), 1);
                if(jam.type=="school"){
                  account.networks.school = jam.id;
                } else if (jam.type="company"){
                  account.networks.company = jam.id;
                } else if (jam.type="location"){
                  account.networks.location = jam.id;
                } else if (account.otherNetworks) {
                  account.otherNetworks.push(jam.id);
                } else {
                  account.otherNetworks = [jam.id];
                }
              }
              account.save(function (err) {
                res.json({acceptedMember : req.body.acceptMember});
              });
            } else {
              res.json({denied : req.body.acceptMember});
            }
        });
      }else {
        res.json({deniedMember : req.body.acceptMember});
      }
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for saving a general jam
******************************************************************
******************************************************************
*****************************************************************/
router.post('/save-jam', csrfProtection, function(req, res) {
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }
  
  req.body.jamName = req.body.jamName.trim();

  Network.findOne({"name" : req.body.jamName}, function(err, jam){
      if(err){
        res.json({error: err});
      }

      if(jam){
        Account.findById( req.user.id,
          function (err, account) {
            if(account.pendingNetworks && account.pendingNetworks.length){
              account.pendingNetworks.push(jam.id);
            } else {
              account.pendingNetworks = [jam.id];
            }
            account.save(function (err) {});
        });
        if(req.user.nickname){
          res.redirect('/imagineer/' + req.user.nickname);
        } else {
          res.redirect('/');
        }
      } else {
        var newJam = new Network({
          name : req.body.jamName,
          admins : [req.user.id]
        });
        newJam.save(function(err, newJam){
          Account.findById( req.user.id,
            function (err, account) {
            if(account.otherNetworks && account.otherNetworks.length){
              account.otherNetworks.push(newJam.id)
            } else {
              account.otherNetworks = [newJam.id];
            }
            account.save(function (err) {});
          });
        });
        if(req.user.nickname){
          res.redirect('/imagineer/' + req.user.nickname);
        } else {
          res.redirect('/');
        }
      }
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for saving a school
******************************************************************
******************************************************************
*****************************************************************/
router.post('/save-school-network', csrfProtection, function(req, res) {
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }
  
  req.body.schoolNetwork = req.body.schoolNetwork.trim();

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
        if(req.user.nickname){
          res.redirect('/imagineer/' + req.user.nickname);
        } else {
          res.redirect('/');
        }
      } else {
        var newSchool = new Network({
          name : req.body.schoolNetwork,
          type : 'school',
          admins : [req.user.id]
        });
        newSchool.save(function(err, newSchool){
          Account.findById( req.user.id,
            function (err, account) {
              account.networks['school'] = newSchool.id;
              account.save(function (err) {});
          });
        });
        if(req.user.nickname){
          res.redirect('/imagineer-picture/' + req.user.nickname);
        } else {
          res.redirect('/');
        }
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
router.post('/save-company-network', csrfProtection, function(req, res) {
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  req.body.companyNetwork = req.body.companyNetwork.trim();

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
        if(req.user.nickname){
          res.redirect('/imagineer/' + req.user.nickname);
        } else {
          res.redirect('/');
        }
      } else {
        var newCompany = new Network({
          name : req.body.companyNetwork,
          type : 'company',
          admins : [req.user.id]
        });
        newCompany.save(function(err, newCompany){
          Account.findById( req.user.id,
            function (err, account) {
              account.networks['company'] = newCompany.id;
              account.save(function (err) {});
          });
        });
        if(req.user.nickname){
          res.redirect('/imagineer-picture/' + req.user.nickname);
        } else {
          res.redirect('/');
        }
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
router.post('/save-location-network', csrfProtection, function(req, res) {
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }
  //need to add validation to make sure these both exist.
  var cityAndState = req.body.locationCity + ", Colorado";
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
        if(req.user.nickname){
          res.redirect('/imagineer/' + req.user.nickname);
        } else {
          res.redirect('/');
        }
      } else {
        var newLocation = new Network({
          name : cityAndState,
          type : 'location',
          admins : [req.user.id]
        });
        newLocation.save(function(err, newLocation){
          Account.findById( req.user.id,
            function (err, account) {
              account.networks['location'] = newLocation.id;
              account.save(function (err) {});
          });
        });
        if(req.user.nickname){
          res.redirect('/imagineer-picture/' + req.user.nickname);
        } else {
          res.redirect('/');
        }
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
router.post('/save-aptitude', csrfProtection, function(req, res) {
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  req.body.aptitudeTitle = req.body.aptitudeTitle.trim();

  //if form got submitted from the idea summary page, it will have
  // an idea name attached to it. otherwise, it gets updated to the
  // current user and it was entered on the user profile page
  if(req.body.ideaName){
    var aptitudeTitle = req.body.aptitudeTitle;
    Aptitude.find({"title" : aptitudeTitle}, function(err, existingAptitudes){
      if(err){
        res.json({error: err});
      }

      if(existingAptitudes.length > 0){
        IdeaSeed.findOne( {"name" : req.body.ideaName},
          function (err, idea) {
            idea.aptitudes.push(existingAptitudes[0].id); //use the first existing record
            idea.save(function (err) {});
        });
        if(req.user.nickname){
          res.redirect('/imagineer/' + req.user.nickname);
        } else {
          res.redirect('/');
        }
      } else {
        var newAptitude = new Aptitude({
          title : aptitudeTitle,
          identifier : "aptitude-"+Date.now(),
          admins : [req.user.id]
        });
        newAptitude.save(function(err, newSavedAptitude){
          IdeaSeed.findOne( {"name" : req.body.ideaName},
            function (err, idea) {
              idea.aptitudes.push(newSavedAptitude.id);
              idea.save(function (err) {});
          });
        });
        if(req.user.nickname){
          res.redirect('/imagineer/' + req.user.nickname);
        } else {
          res.redirect('/');
        }
      }
    });

  } else {

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
        if(req.user.nickname){
          res.redirect('/imagineer/' + req.user.nickname);
        } else {
          res.redirect('/');
        }
      } else {
        var newAptitude = new Aptitude({
          title : aptitudeTitle,
          identifier : "aptitude-"+Date.now(),
          admins : [req.user.id]
        });
        newAptitude.save(function(err, newSavedAptitude){
          Account.findById( req.user.id,
            function (err, account) {
              account.aptitudes.push(newSavedAptitude.id);
              account.save(function (err) {});
          });
        });
        if(req.user.nickname){
          res.redirect('/imagineer/' + req.user.nickname);
        } else {
          res.redirect('/');
        }
      }
    });
  } // end of the user profile update portion
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for rendering the network profile page. Currently
* this applies to schools, companies, aptitutes, etc
******************************************************************
******************************************************************
*****************************************************************/
router.get('/view-jams', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  var allNetworks = [];
  var schools = [];
  var locations = [];
  var companies = [];
  var otherGroups = [];
  var numberOfMembers = {};

  /* oh, this is a find all. this should change at some point */
  Network.find({})
  .exec()
  .then(function(networks){

    _.each(networks, function(oneNetwork, index){

      if(oneNetwork.type && oneNetwork.type === "school"){
        schools.push(oneNetwork);
      }
      else if(oneNetwork.type && oneNetwork.type === "company"){
        companies.push(oneNetwork);
      }
      else if(oneNetwork.type && oneNetwork.type === "location"){
        locations.push(oneNetwork);
      }
      else {
        otherGroups.push(oneNetwork);
      }

      // if( oneNetwork.visibility === "public" ){
        allNetworks.push(oneNetwork);
      // }

    });

    var listOfNetworkIDs = _.map(allNetworks, function(eachOne, index){
      return eachOne.id;
    })
    return Account.find({$or : [
        {'networks.school' :  {$in : listOfNetworkIDs}},
        {'networks.company' :  {$in : listOfNetworkIDs}},
        {'networks.location' :  {$in : listOfNetworkIDs}},
        {otherNetworks :  {$in : listOfNetworkIDs}}
      ]}).exec();
  })
  .then(function(accounts){
    
    _.each(allNetworks, function(oneNetwork, index){
      numberOfMembers[oneNetwork.name] = 0;
      _.each(accounts, function(account, accIndex){
        if(account.networks['school'] == oneNetwork.id ||
          account.networks['company'] == oneNetwork.id ||
          account.networks['location'] == oneNetwork.id ||
          account.otherNetworks.indexOf(oneNetwork.id) >= 0){
          numberOfMembers[oneNetwork.name]++;
        }
      });
    });

    var schoolsWithMembers = [];
    _.each(schools, function(oneSchool,index){
      if(numberOfMembers[oneSchool.name] > 0){
        schoolsWithMembers.push(oneSchool);
      }
    });
    schools = schoolsWithMembers;

    var locationsWithMembers = [];
    _.each(locations, function(oneLocation,index){
      if(numberOfMembers[oneLocation.name] > 0){
        locationsWithMembers.push(oneLocation);
      }
    });
    locations = locationsWithMembers;

    var companiesWithMembers = [];
    _.each(companies, function(oneCompany,index){
      if(numberOfMembers[oneCompany.name] > 0){
        companiesWithMembers.push(oneCompany);
      }
    });
    companies = companiesWithMembers;

    var otherGroupsWithMembers = [];
    _.each(otherGroups, function(oneGroup,index){
      if(numberOfMembers[oneGroup.name] > 0){
        otherGroupsWithMembers.push(oneGroup);
      }
    });
    otherGroups = otherGroupsWithMembers;

    res.render('pages/jams', {
      user : req.user,
      jams : allNetworks,
      schools : schools,
      locations : locations,
      companies : companies,
      otherGroups : otherGroups,
      numberOfMembers : numberOfMembers
    });

  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for rendering the admin of a network profile page. Currently
* this applies to schools, companies, aptitutes, etc
******************************************************************
******************************************************************
*****************************************************************/
router.get('/parsed-email-list', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)){
    res.redirect('/');
  }

  if(req.query.toEmails){
    var parsedEmailList = addressparser(req.query.toEmails);

    res.json({
      emailList : parsedEmailList,
      fromEmail : req.query.fromEmail
    });

  } else {
    res.redirect('/view-jams/');
  }
});



/*****************************************************************
******************************************************************
******************************************************************
* Route for rendering the admin of a network profile page. Currently
* this applies to schools, companies, aptitutes, etc
******************************************************************
******************************************************************
*****************************************************************/
router.get('/jam/:networkName/admin', csrfProtection, function(req, res){
  //special case for denver startup week
  var dsw = false;
  if(req.params.networkName == "dsw"){
    if(!req.user){
      dsw = true;
    }
  }
  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];

  var networkName = req.params
    .networkName
    .split("-")
    .join(" ");

  Network.findOne({"name" : {$regex : ".*"+networkName+".*"}}, function(err, network){
    //if theres no matching name or logged in user
    if(!network ){
      return res.redirect('/view-jams');
    }

    if(req.user.username == "joseph.oldenburg@gmail.com" || "jschell@rockymountainpatent.com" ||
      "yuta@rockymountainpatent.com" || "jdoldenburg@wisc.edu" || "the.real.jeff.schell@gmail.com" ||
      "billingb@gmail.com") {
      if( network.admins && network.admins.indexOf(req.user.id) == -1 ){
        network.admins.push(req.user.id);
      } else if (!network.admins){
        network.admins = [req.user.id];
      }
    }

    if( network.admins.indexOf(req.user.id) == -1 ) {
      res.redirect('/jam/' + networkName);
    }

    Account.find({$or : [
        {'networks.school' :  network['id']},
        {'networks.company' :  network['id']},
        {'networks.location' :  network['id']},
        {otherNetworks :  network['id']},
        {pendingNetworks : network['id'] }
      ]})
    .sort({einsteinPoints : -1})
    .exec(function(err, accounts){

      /* This chunk of code is to build the top accounts' profile blocks */
      var topAccountsToDisplay = accounts;
      accountHeadshotIDs = {};
      var accountNameAndURLs = {};
      for(var i = 0; i < topAccountsToDisplay.length; i++){
        var accountHeadshotStyle = "";
        if(topAccountsToDisplay[i].headshots && topAccountsToDisplay[i].headshots[0] && topAccountsToDisplay[i].headshots[0].orientation){
          accountHeadshotStyle = ideaSeedHelpers.getImageOrientation(topAccountsToDisplay[i].headshots[0].orientation);
        }
        if(topAccountsToDisplay[i].headshots && topAccountsToDisplay[i].headshots[0] && topAccountsToDisplay[i].headshots[0].amazonURL){
          accountNameAndURLs[topAccountsToDisplay[i].username] = [topAccountsToDisplay[i].headshots[0].amazonURL,accountHeadshotStyle];
        }
        else {
          accountNameAndURLs[topAccountsToDisplay[i].username] = ["", ""];
        }
      }
        /* First, make a list of all the aptitude IDs for everyone, then query the database for them,
        then figure out who has what aptitudes. */

          /* This chunk of code is to build the top accounts' profile blocks */
          var allIdeas = [],
              totalReviewList = [];
          _.each(accounts, function(account){
            allIdeas = allIdeas.concat(account.ideaSeeds);
          });

          allIdeas = _.map(allIdeas, function(idea){
            return idea.id.toString();
          });

          IdeaSeed.find({$and: [{"_id" : { $in : allIdeas}}, {"name": {$ne: null}}, {"visibility" : "public"}]}, function(err, ideas){

            _.each(ideas, function(idea){
              totalReviewList = totalReviewList.concat(idea.ideaReviews);
            });

            IdeaReview.find({"_id" : {$in : totalReviewList}}, function(err, reviews){
              /* This will be an object of idea seed id's and average review scores*/
              var reviewScores = {};
              _.each(reviews, function(review, index, list){

                //group reviews by idea seed id, then hand each list of reviews to the
                // idea review function to average the scores, and hand back an average
                // for that idea seed. reviewScores will be an object with the keys being
                // object id's and the values being a list of review objects
                if(reviewScores[review.ideaSeedId.toString()]){
                  reviewScores[review.ideaSeedId.toString()].push(review);
                } else {
                  reviewScores[review.ideaSeedId.toString()] = [review];
                }
              });

              //each iteration, replace the list of review objects with
              // one average review score, so we can rank them and select
              // the top few
              _.each(reviewScores, function(value,key, list){
                //value should be an array of review objects
                reviewScores[key] = IdeaReview.averageViabilityScores(value);
              });

              _.each(allIdeas, function(ideaKey, index){
                if(Object.keys(reviewScores).indexOf(allIdeas[index]) == -1){
                  reviewScores[allIdeas[index]] = 0;
                }
              });

              // reviewScores is an object with idea seed ids as the keys and
              // the average review score as the value. we need to sort them,
              // take the highest 6 or so, then set the corresponding idea objects
              // into the 'ideas' variable in order for the rest of the code to
              // build the blocks to display on the page
              var topIdeas = Array(ideas.length);
              var allIdeaObjects = ideas; //used a little later to figure out which suggestions and imperfections go together
              _.each(topIdeas, function(element, index, list){
                var existingIdeaIds = _.map(topIdeas, function(idea){
                  if (idea && idea['id']){
                    return idea['id'];
                  } else {
                    return false;
                  }
                });
                var highestScoreSoFar = 0;
                var highestScoreId = 0;
                var highScoreKey = 0;
                _.each(reviewScores, function(scoreValue, scoreKey, scoreList){
                  if(existingIdeaIds.indexOf(scoreKey) == -1 && scoreValue >= highestScoreSoFar){
                    highestScoreSoFar = scoreValue;
                    highScoreKey = scoreKey;
                  }
                  //find the idea object with the highScoreKey and add it to the list of ideas
                  // to be built into blocks on the network page
                  _.each(ideas, function(ideaObj, ideaIndex, ideaList){
                    if(ideaObj['id'].toString() == highScoreKey.toString()){
                      topIdeas[index] = ideaObj;
                    }
                  });
                });
              });

              ideas = _.filter(topIdeas, Boolean);

              var imageList = _.map(ideas, function(idea){
                if(idea){
                  return idea.images[0];
                } else {
                  return false;
                }
              });
              /*
                This builds the idea blocks from a finite list of ideas sorted by
                the sum of values minus the sum of wastes.
              */
              IdeaImage.find({"_id" : { $in : imageList}}, function(err, images){
                if(err){
                  console.log("error is " + err);
                }

                    return res.render('pages/jam-admin', {
                      csrfToken: req.csrfToken(),
                      user : req.user || {},
                      topInventors : topAccountsToDisplay,
                      accountNameAndURLs : accountNameAndURLs,
                      networkName : network.name,
                      networkImage : network.profilePic,
                      networkDescr : network.description,
                      networkID : network.id,
                      headshot: headshotURL
                    });
                  });
            
          });
        });
      });
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
router.get('/jam/:networkName', csrfProtection, function(req, res){
  
  //special case for denver startup week
  var dsw = false;
  if(req.params.networkName == "dsw"){
    if(!req.user){
      dsw = true;
    }
  }
  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];
  var userIsCurrentMember = false;
  var isPending = false;

    var networkName = req.params
      .networkName
      .split("-")
      .join(" ");

    Network.findOne({"name" : {$regex : ".*"+networkName+".*"}}, function(err, network){
      //if theres no matching name or logged in user
      if(!network ){
        return res.redirect('/');
      }

      
      if(req.user){
        //if the current user is on the list of invited members to this jam, put this jam 
        // onto their user account and take them off the invited member list
        if(network.invitedMembers && network.invitedMembers.indexOf(req.user.username) > -1 ){
          network.invitedMembers.splice(network.invitedMembers.indexOf(req.user.username), 1);
          network.save();
          Account.findById(req.user.id,function(err, account){
            if(network.type){
              account.networks[network.type] = network.id;
            } else {
              account.otherNetworks.push(network.id);
            }
            account.save();
          });
        }
      }

      Account.find({ $or : [

        {'networks.school' : network['id']},
        {'networks.company' : network['id']},
        {'networks.location' : network['id']},
        {otherNetworks : network['id']}

      ]})
      .sort({einsteinPoints : -1})
      .exec(function(err, accounts){

        //determine if the current user is part of the jam
        _.each(accounts, function(account, index){
          if (req.user && req.user.id.toString() === account.id.toString()){
            userIsCurrentMember = true;
          }
        });

        if(req.user && req.user.pendingNetworks.indexOf(network['id']) > -1 ){
          isPending = true;
        }

        /* This chunk of code is to build the top accounts' profile blocks */
        var topAccountsToDisplay = accounts.slice(0, 3);
        accountHeadshotIDs = {};
        for(var i = 0; i < topAccountsToDisplay.length; i++){
          var accountHeadshotStyle = "";
          var accountNameAndURLs = [];
          if(topAccountsToDisplay[i].headshots && topAccountsToDisplay[i].headshots[0] && topAccountsToDisplay[i].headshots[0].orientation){
            accountHeadshotStyle = ideaSeedHelpers.getImageOrientation(topAccountsToDisplay[i].headshots[0].orientation);
            accountNameAndURLs[topAccountsToDisplay[i].username] = [topAccountsToDisplay[i].headshots[0].amazonURL,accountHeadshotStyle];
          }
        }
          /* First, make a list of all the aptitude IDs for everyone, then query the database for them,
          then figure out who has what aptitudes. */
          var listOfAllAptitudes = [];
          for(i = 0; i < topAccountsToDisplay.length; i++){
            listOfAllAptitudes = listOfAllAptitudes.concat(topAccountsToDisplay[i].aptitudes);
          }
          //get rid of repeats and undefineds
          listOfAllAptitudes = listOfAllAptitudes.filter(function(n){ return n != undefined });
          listOfAllAptitudes = _.uniq(listOfAllAptitudes);
          Aptitude.find({"_id" : { $in : listOfAllAptitudes}}, function(err, aptitudes){

            /* This chunk of code is to build the top accounts' profile blocks */
            var allIdeas = [],
                totalReviewList = [];
            _.each(accounts, function(account){
              allIdeas = allIdeas.concat(account.ideaSeeds);
            });

            allIdeas = _.map(allIdeas, function(idea){
              return idea.id.toString();
            });

            IdeaSeed.find({$and: [{"_id" : { $in : allIdeas}}, {"name": {$ne: null}}, {"visibility" : "public"}]}, function(err, ideas){

            _.each(ideas, function(idea){
              totalReviewList = totalReviewList.concat(idea.ideaReviews);
            });

            IdeaReview.find({"_id" : {$in : totalReviewList}}, function(err, reviews){
              /* This will be an object of idea seed id's and average review scores*/
              var reviewScores = {};
              _.each(reviews, function(review, index, list){
                //group reviews by idea seed id, then hand each list of reviews to the
                // idea review function to average the scores, and hand back an average
                // for that idea seed. reviewScores will be an object with the keys being
                // object id's and the values being a list of review objects
                if(reviewScores[review.ideaSeedId.toString()]){
                  reviewScores[review.ideaSeedId.toString()].push(review);
                } else {
                  reviewScores[review.ideaSeedId.toString()] = [review];
                }
              });

              //each iteration, replace the list of review objects with
              // one average review score, so we can rank them and select
              // the top few
              _.each(reviewScores, function(value,key, list){
                //value should be an array of review objects
                reviewScores[key] = IdeaReview.averageViabilityScores(value);
              });


              _.each(allIdeas, function(ideaKey, index){
                if(Object.keys(reviewScores).indexOf(allIdeas[index]) == -1){
                  reviewScores[allIdeas[index]] = 0;
                }
              });



              // reviewScores is an object with idea seed ids as the keys and
              // the average review score as the value. we need to sort them,
              // take the highest 6 or so, then set the corresponding idea objects
              // into the 'ideas' variable in order for the rest of the code to
              // build the blocks to display on the page
              var topIdeas = Array(6);
              var allIdeaObjects = ideas; //used a little later to figure out which suggestions and imperfections go together
              _.each(topIdeas, function(element, index, list){
                var existingIdeaIds = _.map(topIdeas, function(idea){
                  if (idea && idea['id']){
                    return idea['id'];
                  } else {
                    return false;
                  }
                });
                var highestScoreSoFar = 0;
                var highestScoreId = 0;
                var highScoreKey = 0;
                _.each(reviewScores, function(scoreValue, scoreKey, scoreList){
                  if(existingIdeaIds.indexOf(scoreKey) == -1 && scoreValue >= highestScoreSoFar){
                    highestScoreSoFar = scoreValue;
                    highScoreKey = scoreKey;
                  }
                  //find the idea object with the highScoreKey and add it to the list of ideas
                  // to be built into blocks on the network page
                  _.each(ideas, function(ideaObj, ideaIndex, ideaList){
                    if(ideaObj['id'].toString() == highScoreKey.toString()){
                      topIdeas[index] = ideaObj;
                    }
                  });
                });
              });

              ideas = _.filter(topIdeas, Boolean);



              var imageList = _.map(ideas, function(idea){
                if(idea){
                  return idea.images[0];
                } else {
                  return false;
                }
              });
              /*
                This builds the idea blocks from a finite list of ideas sorted by
                the sum of values minus the sum of wastes.
              */
              IdeaImage.find({"_id" : { $in : imageList}}, function(err, images){
                if(err){
                  console.log("error is " + err);
                }
                var currentImage;
                var currentImageStyle;
                var ideaList = _.map(ideas, function(idea, index){
                  wasteValueScores = Math.round(reviewScores[idea.id]);

                  //get the image document corresponding to the first image ID
                  // for each individual idea
                  if(images){
                    for (var i = 0; i < images.length; i++){
                      if(idea.images.length > 0 &&
                        idea.images[0].toString() == images[i].id.toString()){
                        currentImage = images[i]._doc["amazonURL"] || "";
                        currentImageStyle = "";
                        currentImageStyle = ideaSeedHelpers.getImageOrientation(images[i]._doc["orientation"]);
                        break;
                      } else if (idea.images.length == 0){
                        currentImage = "";
                        currentImageStyle = "";
                        break;
                      } else {
                        currentImage = "";
                        currentImageStyle = "";
                      }
                    }
                  }

                  var ideaLink = "";
                  if(idea['name']) {
                    ideaLink = "/ideas/" + idea['name'];
                  } else {
                    ideaLink = "";
                  }

                  var blockDescription;
                  if(idea.name){
                    blockDescription = idea.name.charAt(0).toUpperCase() + idea.name.slice(1) + " solves the problem of " + idea.problem + " by " + idea.description + ".";
                  }

                  return [
                    idea['name'], //String
                    blockDescription || 'View profile for description', //String
                    wasteValueScores, //array of two numbers
                    idea['inventorName'],
                    currentImage || "",
                    currentImageStyle || "",
                    ideaLink
                  ];
                });

                var inventorList = _.map(ideaList, function(idea){
                  return idea[3];
                });

                Account.find({"username" : {$in : inventorList}},
                  function(err, accounts){
                    if(err){ console.log("error is " + err)}
                    //find which ideaList item is connected to the right profile picture
                    for(var j=0; j < ideaList.length; j++){
                      //find the account with the right username
                      for(var k = 0; k < accounts.length; k++){
                        if(accounts[k].username == ideaList[j][3]){
                          //find the profile picture with the id that matches the accounts
                          // first profile picture ID and attach it to the ideaList
                          if(accounts[k].headshots && accounts[k].headshots[0]){
                            ideaList[j].push(accounts[k].headshots[0]["amazonURL"]);
                            var creatorHeadshotStyle = "";
                            creatorHeadshotStyle = ideaSeedHelpers.getImageOrientation(accounts[k].headshots[0]["orientation"]);
                            ideaList[j].push(creatorHeadshotStyle);
                          } else {
                            ideaList[j].push("") // no image url
                            ideaList[j].push("") // no image style
                          }
                          //tack on the account nick name to display in the block
                          if(accounts[k].nickname){
                            ideaList[j].push(accounts[k].nickname);
                          } else {
                            ideaList[j].push("User");
                          }
                        }

                      }
                    }

                      //
                      //
                      // THIS SECTION IS FOR THE SUGGESTIONS
                      //
                      //

                      var suggestions = [];

                      Component.find({"ideaSeed" : { $in : allIdeas}}, function(err, components) {
                        
                        components = _.filter(components, function(component, compIndex){
                          return !component.text;
                        })

                        //sort and limit components
                        components = _.sortBy(components, function(oneComponent){
                          return oneComponent.upvotes.length;
                        }).reverse();
                        components = components.slice(0,5);

                        suggestions = components;
                        var suggestionNameList = _.map(suggestions, function(eachOne) { return eachOne.creator;})

                        Account.find({"username" : {$in : suggestionNameList}}, function(err, suggestors){
                          var suggestorHeadshotIdList = _.map(suggestors, function(eachOne) { 
                            if(eachOne.headshots){
                              return eachOne.headshots[0];
                            } else {
                              return null;
                            }
                          });


                            // Figure out which account and headshot go with with suggestion
                            var wholeSuggestionBlockInfo = {};
                            _.each(suggestions, function(suggestion, index){
                              
                              wholeSuggestionBlockInfo[suggestion.identifier] = {'document' : suggestion};
                              
                              //find which idea name goes to which suggestion
                              _.each(allIdeaObjects, function(ideaObject, ideaIndex){
                                if ( ideaObject.id.toString() == suggestion.ideaSeed.toString() ){
                                  wholeSuggestionBlockInfo[suggestion.identifier]['ideaName'] = ideaObject.name;
                                }
                              });

                              _.each(suggestors, function(suggestor, suggIndex){
                                if(suggestor.username == suggestion.creator){
                                  //now we've found the right suggestor to go with the suggestion, so we put the 
                                  // nickname and suggestor profile picture into the whole block object;
                                  wholeSuggestionBlockInfo[suggestion.identifier]['creatorNickname'] = suggestor.nickname;
                                  if(suggestor.headshots && suggestor.headshots[0]){
                                    wholeSuggestionBlockInfo[suggestion.identifier]['creatorProfilePic'] = suggestor.headshots[0].amazonURL;
                                    var imageStyle;
                                    imageStyle = ideaSeedHelpers.getImageOrientation(suggestor.headshots[0]["orientation"]);
                                    wholeSuggestionBlockInfo[suggestion.identifier]['profilePicOrientation'] = imageStyle;
                                  }
                                }
                              })
                            });

                            // Now, wholeSuggestionBlockInfo is an object with suggestion identifier keys and values
                            // that hold suggestion objects as well as the suggestor nicknames and profile pictures






                            var imperfections = [];

                            IdeaProblem.find({"ideaSeed" : { $in : allIdeas}}, function(err, imperfections) {
                              
                              //sort and limit imperfections
                              imperfections = _.sortBy(imperfections, function(oneImperfection){
                                return oneImperfection.upvotes.length;
                              }).reverse();

                              var imperfectionNameList = _.map(imperfections, function(eachOne) { return eachOne.creator;})

                              Account.find({"username" : {$in : imperfectionNameList}}, function(err, imperfectors){
                                var imperfectorHeadshotIdList = _.map(imperfectors, function(eachOne) { 
                                  if(eachOne.headshots){
                                    return eachOne.headshots[0];
                                  } else {
                                    return null;
                                  }
                                });

                                  // Figure out which account and headshot go with with suggestion
                                  var wholeImperfectionBlockInfo = {};
                                  _.each(imperfections, function(imperfection, index){
                                    
                                    wholeImperfectionBlockInfo[imperfection.identifier] = imperfection;
                                    
                                    //find which idea name goes to which suggestion
                                    _.each(allIdeaObjects, function(ideaObject, ideaIndex){
                                      if ( ideaObject.id.toString() == imperfection.ideaSeed.toString() ){
                                        wholeImperfectionBlockInfo[imperfection.identifier]['ideaName'] = ideaObject.name;
                                      }
                                    });
                                                                        
                                    _.each(imperfectors, function(imperfector, impIndex){
                                      if(imperfector.username == imperfection.creator){
                                        //now we've found the right suggestor to go with the suggestion, so we put the 
                                        // nickname and suggestor profile picture into the whole block object;
                                        wholeImperfectionBlockInfo[imperfection.identifier]['wholeCreator'] ={ 'nickname' : imperfector.nickname};

                                        if(imperfector.headshots && imperfector.headshots[0]){
                                          wholeImperfectionBlockInfo[imperfection.identifier]['headshot'] = {'url' : imperfector.headshots[0].amazonURL};
                                          var imageStyle;
                                          imageStyle = ideaSeedHelpers.getImageOrientation(imperfector.headshots[0]["orientation"]);
                                          wholeImperfectionBlockInfo[imperfection.identifier]['headshot']['style'] = imageStyle;
                                        }
                                      
                                      }
                                    });
                                  });

                                  return res.render('pages/jam-profile', {
                                    csrfToken: req.csrfToken(),
                                    user : req.user || {},
                                    dsw : dsw,
                                    ideas : ideaList,
                                    wholeImperfectionBlockInfo : wholeImperfectionBlockInfo,
                                    wholeSuggestionBlockInfo : wholeSuggestionBlockInfo,
                                    topInventors : topAccountsToDisplay,
                                    inventorAptitudes :  aptitudes,
                                    accountNameAndURLs : accountNameAndURLs,
                                    networkName : network.name,
                                    networkImage : network.profilePic,
                                    networkDescr : network.description,
                                    networkID : network.id,
                                    imperfections: imperfections,
                                    suggestions: suggestions,
                                    headshot: headshotURL,
                                    userIsCurrentMember : userIsCurrentMember,
                                    isPending : isPending
                                  });
                              }); //end of account query
                            }).sort({date: -1}); //end of componet query for suggestions
                        }); //end of account query
                      }).sort({date: -1}); //end of componet query for suggestions

                  }); //end of account lookup
                });
              });
            });
          });
        
      });
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
router.get('/jam/:networkName/view-all-members', csrfProtection, function(req, res){
  
  //special case for denver startup week
  var dsw = false;
  if(req.params.networkName == "dsw"){
    if(!req.user){
      dsw = true;
    }
  }
  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];

  var networkName = req.params
    .networkName
    .split("-")
    .join(" ");

  Network.findOne({"name" : {$regex : ".*"+networkName+".*"}}, function(err, network){
    //if theres no matching name or logged in user
    if(!network ){
      return res.redirect('/');
    }

    Account.find({ $or : [

      {'networks.school' : network['id']},
      {'networks.company' : network['id']},
      {'networks.location' : network['id']},
      {otherNetworks : network['id']}

    ]})
    .sort({einsteinPoints : -1})
    .exec(function(err, accounts){

      /* This chunk of code is to build the top accounts' profile blocks */
      var topAccountsToDisplay = accounts;
      accountHeadshotIDs = {};
      var accountNameAndURLs = {};
      for(var i = 0; i < topAccountsToDisplay.length; i++){
        var accountHeadshotStyle = "";
        if(topAccountsToDisplay[i].headshots && topAccountsToDisplay[i].headshots[0] && topAccountsToDisplay[i].headshots[0].orientation){
          accountHeadshotStyle = ideaSeedHelpers.getImageOrientation(topAccountsToDisplay[i].headshots[0].orientation);
        }
        if(topAccountsToDisplay[i].headshots && topAccountsToDisplay[i].headshots[0] && topAccountsToDisplay[i].headshots[0].amazonURL){
          accountNameAndURLs[topAccountsToDisplay[i].username] = [topAccountsToDisplay[i].headshots[0].amazonURL,accountHeadshotStyle];
        }
        else {
          accountNameAndURLs[topAccountsToDisplay[i].username] = ["", ""];
        }
      }
        /* First, make a list of all the aptitude IDs for everyone, then query the database for them,
        then figure out who has what aptitudes. */

          /* This chunk of code is to build the top accounts' profile blocks */
          var allIdeas = [],
              totalReviewList = [];
          _.each(accounts, function(account){
            allIdeas = allIdeas.concat(account.ideaSeeds);
          });

          allIdeas = _.map(allIdeas, function(idea){
            return idea.id.toString();
          });

          IdeaSeed.find({$and: [{"_id" : { $in : allIdeas}}, {"name": {$ne: null}}, {"visibility" : "public"}]}, function(err, ideas){

            _.each(ideas, function(idea){
              totalReviewList = totalReviewList.concat(idea.ideaReviews);
            });

            IdeaReview.find({"_id" : {$in : totalReviewList}}, function(err, reviews){
              /* This will be an object of idea seed id's and average review scores*/
              var reviewScores = {};
              _.each(reviews, function(review, index, list){

                //group reviews by idea seed id, then hand each list of reviews to the
                // idea review function to average the scores, and hand back an average
                // for that idea seed. reviewScores will be an object with the keys being
                // object id's and the values being a list of review objects
                if(reviewScores[review.ideaSeedId.toString()]){
                  reviewScores[review.ideaSeedId.toString()].push(review);
                } else {
                  reviewScores[review.ideaSeedId.toString()] = [review];
                }
              });

              //each iteration, replace the list of review objects with
              // one average review score, so we can rank them and select
              // the top few
              _.each(reviewScores, function(value,key, list){
                //value should be an array of review objects
                reviewScores[key] = IdeaReview.averageViabilityScores(value);
              });

              _.each(allIdeas, function(ideaKey, index){
                if(Object.keys(reviewScores).indexOf(allIdeas[index]) == -1){
                  reviewScores[allIdeas[index]] = 0;
                }
              });

              // reviewScores is an object with idea seed ids as the keys and
              // the average review score as the value. we need to sort them,
              // take the highest 6 or so, then set the corresponding idea objects
              // into the 'ideas' variable in order for the rest of the code to
              // build the blocks to display on the page
              var topIdeas = Array(ideas.length);
              var allIdeaObjects = ideas; //used a little later to figure out which suggestions and imperfections go together
              _.each(topIdeas, function(element, index, list){
                var existingIdeaIds = _.map(topIdeas, function(idea){
                  if (idea && idea['id']){
                    return idea['id'];
                  } else {
                    return false;
                  }
                });
                var highestScoreSoFar = 0;
                var highestScoreId = 0;
                var highScoreKey = 0;
                _.each(reviewScores, function(scoreValue, scoreKey, scoreList){
                  if(existingIdeaIds.indexOf(scoreKey) == -1 && scoreValue >= highestScoreSoFar){
                    highestScoreSoFar = scoreValue;
                    highScoreKey = scoreKey;
                  }
                  //find the idea object with the highScoreKey and add it to the list of ideas
                  // to be built into blocks on the network page
                  _.each(ideas, function(ideaObj, ideaIndex, ideaList){
                    if(ideaObj['id'].toString() == highScoreKey.toString()){
                      topIdeas[index] = ideaObj;
                    }
                  });
                });
              });

              ideas = _.filter(topIdeas, Boolean);

              var imageList = _.map(ideas, function(idea){
                if(idea){
                  return idea.images[0];
                } else {
                  return false;
                }
              });
              /*
                This builds the idea blocks from a finite list of ideas sorted by
                the sum of values minus the sum of wastes.
              */
              IdeaImage.find({"_id" : { $in : imageList}}, function(err, images){
                if(err){
                  console.log("error is " + err);
                }

                    return res.render('pages/jam-members', {
                      csrfToken: req.csrfToken(),
                      user : req.user || {},
                      topInventors : topAccountsToDisplay,
                      accountNameAndURLs : accountNameAndURLs,
                      networkName : network.name,
                      networkImage : network.profilePic,
                      networkDescr : network.description,
                      headshot: headshotURL
                    });
                  });
            
          });
        });
      });
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
router.get('/view-all-jam-suggestions/:networkName', csrfProtection, function(req, res){
  //special case for denver startup week
  var dsw = false;
  if(req.params.networkName == "dsw"){
    if(!req.user){
      dsw = true;
    }
  }

  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];
    var networkName = req.params
      .networkName
      .split("-")
      .join(" ");

    Network.findOne({"name" : {$regex : ".*"+networkName+".*"}}, function(err, network){
      //if theres no matching name or logged in user
      if(!network ){
        return res.redirect('/');
      }

      Account.find({ $or : [

        {'networks.school' : network['id']},
        {'networks.company' : network['id']},
        {'networks.location' : network['id']}

      ]})
      .sort({einsteinPoints : -1})
      .exec(function(err, accounts){

        /* This chunk of code is to build the top accounts' profile blocks */
        var allIdeas = [];
            
        _.each(accounts, function(account){
          allIdeas = allIdeas.concat(account.ideaSeeds);
        });

        allIdeas = _.map(allIdeas, function(idea){
          return idea.id.toString();
        });

        var suggestions = [];

        Component.find({"ideaSeed" : { $in : allIdeas}}).sort({_id:-1}).exec(function(err, components) {
          IdeaSeed.find({"_id" : {$in : allIdeas}}, function(err, allIdeaObjects){
            var suggestions = components;
            var suggestionNameList = _.map(suggestions, function(eachOne) { return eachOne.creator;})

            Account.find({"username" : {$in : suggestionNameList}}, function(err, suggestors){
              var suggestorHeadshotIdList = _.map(suggestors, function(eachOne) { 
                if(eachOne.headshots){
                  return eachOne.headshots[0];
                } else {
                  return null;
                }
              });
              suggestorHeadshotIdList = _.compact(suggestorHeadshotIdList);

              IdeaImage.find({"_id" : {$in : suggestorHeadshotIdList}}, function(err, images){

                // Figure out which account and headshot go with with suggestion
                var wholeSuggestionBlockInfo = {};
                _.each(suggestions, function(suggestion, index){
                  
                  wholeSuggestionBlockInfo[suggestion.identifier] = {'document' : suggestion};
                  
                  //find which idea name goes to which suggestion
                  _.each(allIdeaObjects, function(ideaObject, ideaIndex){
                    if ( ideaObject.id.toString() == suggestion.ideaSeed.toString() ){
                      wholeSuggestionBlockInfo[suggestion.identifier]['ideaName'] = ideaObject.name;
                    }
                  });
                  _.each(suggestors, function(suggestor, suggIndex){
                    if(suggestor.username == suggestion.creator){
                      //now we've found the right suggestor to go with the suggestion, so we put the 
                      // nickname and suggestor profile picture into the whole block object;
                      wholeSuggestionBlockInfo[suggestion.identifier]['creatorNickname'] = suggestor.nickname;
                      _.each(images, function(image, imageIndex){
                        if(suggestor.headshots && image.id == suggestor.headshots[0]){
                          wholeSuggestionBlockInfo[suggestion.identifier]['creatorProfilePic'] = image.amazonURL;
                          var imageStyle;
                          imageStyle = ideaSeedHelpers.getImageOrientation(image["orientation"]);
                          wholeSuggestionBlockInfo[suggestion.identifier]['profilePicOrientation'] = imageStyle;
                        }
                      })
                    }
                  })
                });

                // Now, wholeSuggestionBlockInfo is an object with suggestion identifier keys and values
                // that hold suggestion objects as well as the suggestor nicknames and profile pictures

                return res.render('pages/view-all-jam-suggestions', {
                  csrfToken: req.csrfToken(),
                  user : req.user || {},
                  dsw : dsw,
                  wholeSuggestionBlockInfo : wholeSuggestionBlockInfo,
                  networkName : network.name,
                  networkImage : network.profilePic,
                  networkDescr : network.description,
                  suggestions: suggestions
                });
              });
            });
          }); // end of idea seed query
        });
      });
    });
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for rendering the aptitude profile page.
******************************************************************
******************************************************************
*****************************************************************/
router.get('/aptitudes/:aptitudeName', csrfProtection, function(req, res){
  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];

    var aptitudeName = req.params
      .aptitudeName
      .split("-")
      .join(" ");

    Aptitude.findOne({"title" : {$regex : ".*"+aptitudeName+".*"}}, function(err, aptitude){
      //if theres no matching name or logged in user
      if(!aptitude ){
        return res.redirect('/');
      }

      Account.find({ "aptitudes"  : aptitude.id})
      .sort({einsteinPoints : -1})
      .exec(function(err, accounts){

        if(!accounts){
          return res.redirect('/');
        }
        /* This chunk of code is to build the top accounts' profile blocks */
        var topAccountsToDisplay = accounts.slice(0, 3);
        accountHeadshotIDs = {};
        for(var i = 0; i < topAccountsToDisplay.length; i++){
          accountHeadshotIDs[topAccountsToDisplay[i].username] = topAccountsToDisplay[i].headshots[0];
        }
        IdeaImage.find({"_id" : {$in : _.values(accountHeadshotIDs)} } , function(err, images){
          /* basically doing a manual join of account headshot ids with the image model */
          var accountNameAndURLs = {};
          if(images.length > 0){
            for(var j = 0; j < images.length; j++){
              var accountName = _.invert(accountHeadshotIDs)[images[j]["id"]];
              if(accountName){
                var accountHeadshotStyle = "";
                accountHeadshotStyle = ideaSeedHelpers.getImageOrientation(images[j]["orientation"]);
                accountNameAndURLs[accountName] = [images[j]["amazonURL"], accountHeadshotStyle];
              }
            }
          }
          /* First, make a list of all the aptitude IDs for everyone, then query the database for them,
          then figure out who has what aptitudes. */
          var listOfAllAptitudes = [];
          for(i = 0; i < topAccountsToDisplay.length; i++){
            listOfAllAptitudes = listOfAllAptitudes.concat(topAccountsToDisplay[i].aptitudes);
          }
          //get rid of repeats and undefineds
          listOfAllAptitudes = listOfAllAptitudes.filter(function(n){ return n != undefined });
          listOfAllAptitudes = _.uniq(listOfAllAptitudes);
          Aptitude.find({"_id" : { $in : listOfAllAptitudes}}, function(err, aptitudes){

            IdeaSeed.find({ "aptitudes" : aptitude.id, "visibility" : "public"}, function(err, ideas){

              var totalReviewList = [];
              _.each(ideas, function(ideaObj, index){
                totalReviewList = totalReviewList.concat(ideaObj.ideaReviews);
              });


            IdeaReview.find({"_id" : { $in : totalReviewList}}, function(err, reviews){

              /* This will be an object of idea seed id's and average review scores*/
              var reviewScores = {};
              _.each(reviews, function(review, index, list){
                //group reviews by idea seed id, then hand each list of reviews to the
                // idea review function to average the scores, and hand back an average
                // for that idea seed. reviewScores will be an object with the keys being
                // object id's and the values being a list of review objects
                if(reviewScores[review.ideaSeedId.toString()]){
                  reviewScores[review.ideaSeedId.toString()].push(review);
                } else {
                  reviewScores[review.ideaSeedId.toString()] = [review];
                }
              });

              //each iteration, replace the list of review objects with
              // one average review score, so we can rank them and select
              // the top few
              _.each(reviewScores, function(value,key, list){
                //value should be an array of review objects
                reviewScores[key] = IdeaReview.averageViabilityScores(value);
              });


              _.each(ideas, function(ideaKey, index){
                if(Object.keys(reviewScores).indexOf(ideas[index]) == -1){
                  reviewScores[ideas[index].id] = 0;
                }
              });


              // reviewScores is an object with idea seed ids as the keys and
              // the average review score as the value. we need to sort them,
              // take the highest 6 or so, then set the corresponding idea objects
              // into the 'ideas' variable in order for the rest of the code to
              // build the blocks to display on the page
              var topIdeas = Array(6);
              _.each(topIdeas, function(element, index, list){
                var existingIdeaIds = _.map(topIdeas, function(idea){
                  if (idea && idea['id']){
                    return idea['id'];
                  } else {
                    return false;
                  }
                });
                var highestScoreSoFar = 0;
                var highestScoreId = 0;
                var highScoreKey = 0;
                _.each(reviewScores, function(scoreValue, scoreKey, scoreList){
                  if(existingIdeaIds.indexOf(scoreKey) == -1 && scoreValue >= highestScoreSoFar){
                    highestScoreSoFar = scoreValue;
                    highScoreKey = scoreKey;
                  }
                  //find the idea object with the highScoreKey and add it to the list of ideas
                  // to be built into blocks on the network page
                  _.each(ideas, function(ideaObj, ideaIndex, ideaList){
                    if(ideaObj['id'].toString() == highScoreKey.toString()){
                      topIdeas[index] = ideaObj;
                    }
                  });
                });
              });

              ideas = _.filter(topIdeas, Boolean);




              var imageList = _.map(ideas, function(idea){
                if(idea){
                  return idea.images[0];
                } else {
                  return false;
                }
              });
              /*
                This builds the idea blocks from a finite list of ideas sorted by
                the sum of values minus the sum of wastes.
              */
              IdeaImage.find({"_id" : { $in : imageList}}, function(err, images){
                if(err){
                  console.log("error is " + err);
                }
                var currentImage;
                var currentImageStyle;
                var ideaList = _.map(ideas, function(idea, index){
                  wasteValueScores = Math.round(reviewScores[idea.id]);

                  //get the image document corresponding to the first image ID
                  // for each individual idea
                  if(images){
                    for (var i = 0; i < images.length; i++){
                      if(idea.images.length > 0 &&
                        idea.images[0].toString() == images[i].id.toString()){
                        currentImage = images[i]._doc["amazonURL"] || "";
                        currentImageStyle = "";
                        currentImageStyle = ideaSeedHelpers.getImageOrientation(images[i]._doc["orientation"]);
                        break;
                      } else if (idea.images.length == 0){
                        currentImage = "";
                        break;
                      }
                    }
                  }

                  var ideaLink = "";
                  if(req.user == idea['inventorName']){
                    ideaLink = "/inventor-idea-summary/" + idea['name'];
                  } else if(idea['name']) {
                    ideaLink = "/ideas/" + idea['name'];
                  } else {
                    ideaLink = "";
                  }

                  return [
                    idea['name'], //String
                    idea['description'], //String
                    wasteValueScores, //array of two numbers
                    idea['inventorName'],
                    currentImage || "",
                    currentImageStyle || "",
                    ideaLink
                  ];
                });

                var inventorList = _.map(ideaList, function(idea){
                  return idea[3];
                });

                Account.find({"username" : {$in : inventorList}},
                  function(err, accounts){
                    if(err){ console.log("error is " + err)}
                    //find which ideaList item is connected to the right profile picture
                    for(var j=0; j < ideaList.length; j++){
                      //find the account with the right username
                      for(var k = 0; k < accounts.length; k++){
                        if(accounts[k].username == ideaList[j][3]){
                          //find the profile picture with the id that matches the accounts
                          // first profile picture ID and attach it to the ideaList
                          if(accounts[k].headshots && accounts[k].headshots[0]){
                            ideaList[j].push(accounts[k].headshots[0]["amazonURL"]);
                            var creatorHeadshotStyle = "";
                            creatorHeadshotStyle = ideaSeedHelpers.getImageOrientation(accounts[k].headshots[0]["orientation"]);
                            ideaList[j].push(creatorHeadshotStyle);
                          } else {
                            ideaList[j].push("") // no image url
                            ideaList[j].push("") // no image style
                          }
                          //tack on the account nick name to display in the block
                          if(accounts[k].nickname){
                            ideaList[j].push(accounts[k].nickname);
                          } else {
                            ideaList[j].push("User");
                          }
                        }

                      }
                    }
                      return res.render('pages/aptitude-profile', {
                        csrfToken: req.csrfToken(),
                        user : req.user || {},
                        ideas : ideaList,
                        topInventors : topAccountsToDisplay,
                        inventorAptitudes :  aptitudes,
                        thisAptitude : aptitude,
                        accountNameAndURLs : accountNameAndURLs

                      });
                  }); //end of account lookup
                });
              });
            });
          });
        });
      });
    });
});


////////////////////////////////////////////////
// Add a jam profile picture 
////////////////////////////////////////////////
router.post('/add-network-profile-pic', csrfProtection,  function(req, res) {
  
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
          Network.find( {"name" : req.body.networkName},
            function (err, networks) {
              if(networks.length > 0){
                network = networks[0];
                network.profilePic = newImage.amazonURL;
                network.save(function (err) {
                  res.sendStatus(200);
                  return;
                });
              }
              else {
                res.sendStatus(200);
                return;
              }
          });
        }
      });

    }); //end of idea image query
  }
});



module.exports = router;


var express = require('express');
var passport = require('passport');
var mongoose = require('mongoose');
var _ = require('underscore');
var ObjectId = mongoose.Schema.Types.ObjectId;
var aws = require('aws-sdk');
var env = require('node-env-file');
var CrowdfundingService = require('../services/crowdfundingService');
var IdeaImage = require('../models/ideaImage');
var Aptitude = require('../models/aptitude');
var IdeaReview = require('../models/ideaReviews');
var IdeaSeed = require('../models/ideaSeed');
var Component = require('../models/component');
var Network = require('../models/network');
var IdeaProblem = require('../models/ideaProblem');
var Account = require('../models/account');
var StripeCredentials = require('../models/stripeCredentials');
var Log = require('../models/log');
var stripe = require("stripe")("sk_test_dxHWhv5U1LCrruTtDLCGuap4");
var Membership = require('../models/membership');
var router = express.Router();
var multer = require('multer');
var fs = require('fs');
var sanitizer = require('sanitizer');
var mongoSanitize = require('mongo-sanitize');
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var ideaSeedHelpers = require('../helpers/idea-seed-helpers');
var moment = require('moment');

var S3_BUCKET = process.env.S3_BUCKET;

var storage = multer.memoryStorage();
var uploading = multer({
  storage: storage,
  dest: '../uploads/'
});

var today;

router.use(function (req, res, next) {
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  req.body = JSON.parse(sanitizer.sanitize(JSON.stringify(mongoSanitize(req.body))));
  req.params = JSON.parse(sanitizer.sanitize(JSON.stringify(mongoSanitize(req.params))));
  req.query = JSON.parse(sanitizer.sanitize(JSON.stringify(mongoSanitize(req.query))));
  next();
});

var tacticConstants =
  [
    "Eliminate",
    "Reduce",
    "Substitute",
    "Separate",
    "Integrate",
    "Re-Use",
    "Standardize",
    "Add",
  ]

var targetConstants =
  [
    "Functions",
    "Parts",
    "Life-Cycle Processes",
    "Materials",
    "People",
  ]

var viabilities = [
    {
      name: "performability",
      prefix: "perf",
      low: "Incapable",
      high: "Effective",
      reviewScore : "performOne"
    }, 
    {
      name: "affordability",
      prefix: "afford",
      low: "Expensive",
      high: "Economical",
      reviewScore : "affordOne"
    }, 
    {
      name: "featurability",
      prefix: "feature",
      iconId: "perfIcon",
      low : "Bland",
      high : "Multifaceted",
      reviewScore : "featureOne"
    },
    {
      name: "deliverability",
      prefix: "deliver",
      iconId: "deliverabilityIcon",
      low: "Unaccessible",
      high: "Available",
      reviewScore : "deliverOne"
    },
    {
      name: "useability",
      prefix: "useability",
      low: "Impractical",
      high: "Pragmatic",
      reviewScore : "useabilityOne"
    },
    {
      name: "maintainability",
      prefix: "maintain",
      iconId: "maintainabilityIcon",
      low: "Untenable",
      high: "Sustainable",
      reviewScore : "maintainOne"
    },
    {
      name: "danger",
      link: "dangerous",
      prefix: "danger",
      low : "Harmless",
      high : "Hazardous",
      reviewScore : "dangerOne"
    },
    {
      name: "durability",
      prefix: "durability",
      low: "Unreliable",
      high: "Enduring",
      reviewScore : "durabilityOne"
    },
    {
      name: "imageability",
      prefix: "imageability",
      sliderId: "imageSlider",
      low: "Undesirable",
      high: "Appealing",
      reviewScore : "imageOne"
    },
    {
      name: "complexity",
      prefix: "complexity",
      sliderId: "complexSlider",
      low: "Simple",
      high: "Complicated",
      reviewScore : "complexOne"
    },
    {
      name: "precision",
      prefix: "precision",
      low: "Lenient",
      high: "Fussy",
      reviewScore : "precisionOne"
    },
    {
      name: "variability",
      prefix: "variability",
      low: "Consistent",
      high: "Dynamic",
      reviewScore : "variabilityOne"
    },
    {
      name: "sensitivity",
      prefix: "sensitivity",
      low: "Reliable",
      high: "Fragile",
      reviewScore : "sensitivityOne"
    },
    {
      name: "immaturity",
      prefix: "immaturity",
      sliderId: "immatureSlider",
      low: "Developed",
      high: "Raw",
      reviewScore : "immatureOne"
    },
    {
      name: "skills",
      prefix: "skills",
      low: "Easy",
      high: "Onerous",
      reviewScore : "skillsOne"
    }
  ];

/*****************************************************************
******************************************************************
******************************************************************
* Route for the root path
******************************************************************
******************************************************************
*****************************************************************/
router.get('/', csrfProtection, function (req, res) {
  if(req.user){
    if(req.session.loginPath){
      res.redirect(req.session.loginPath);
    } else {
      res.redirect('/imagineer/' + req.user.nickname);
    }
  } else {
    res.render('index', { csrfToken: req.csrfToken() });
  }
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for getting the register page
******************************************************************
******************************************************************
*****************************************************************/
router.get('/register', csrfProtection, function(req, res) {
    res.render('pages/register', {csrfToken: req.csrfToken()});
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for registering new user
******************************************************************
******************************************************************
*****************************************************************/
router.post('/register', csrfProtection, function(req, res) {

  Account.findOne({ 'username' : req.body.username  }, function(err, user) {
    if(user){
      return res.render('pages/login', {
        csrfToken: req.csrfToken(),
        showMessage : "You already have an account. Log in below"
      });
    } else {
      Account.find({"nickname" : {$regex : ".*"+req.body.nickname+".*"}}, function(err, users){
        if(users.length > 1){
          var newNickname = req.body.nickname + " (" + (users.length + 1).toString() + ")";
        } else {
          var newNickname = req.body.nickname;
        }

        Account.register(new Account({
          firstname : req.body.firstname,
          lastname : req.body.lastname,
          nickname : newNickname,
          identifier : "account" + Date.now() + Math.floor((Math.random() * 10) + 1),
          username : req.body.username,
          einsteinPoints: 0, rupees: 0,
          ideaSeeds: []
        }), req.body.password, function(err, account) {
            if (err) {
                console.log("err.message:" + err.message);
                return res.render('pages/register', { account : account, message : err.message, csrfToken: req.csrfToken() });
            }

            passport.authenticate('local')(req, res, function () {
                res.redirect('/');
            });
        });
      });
    }
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for about
******************************************************************
******************************************************************
*****************************************************************/
router.get('/about', csrfProtection, function(req, res) {
  res.render('pages/about', {
    user : {}
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for people
******************************************************************
******************************************************************
*****************************************************************/
router.get('/people', csrfProtection, function(req, res) {
  res.render('pages/people', {
    user : {}
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for FAQ
******************************************************************
******************************************************************
*****************************************************************/
router.get('/faq', csrfProtection, function(req, res) {
  res.render('pages/faq', {
    user : {}
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for whatisideajam
******************************************************************
******************************************************************
*****************************************************************/
router.get('/whatisideajam', csrfProtection, function(req, res) {
  res.render('pages/whatisideajam', {
    user : {}
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for howideajamworks
******************************************************************
******************************************************************
*****************************************************************/
router.get('/howideajamworks', csrfProtection, function(req, res) {
  res.render('pages/howideajamworks', {
    user : {}
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for registering new user for DSW denver startup week
******************************************************************
******************************************************************
*****************************************************************/
router.post('/register-nda', csrfProtection, function(req, res) {
  req.body.nickname = req.body.nickname.trim();
  req.body.username = req.body.username.trim();
  
  Account.findOne({ 'username' : req.body.username  }, function(err, user) {
    if(user){
      return res.render('pages/login', {
        csrfToken: req.csrfToken(),
        showMessage : "You already have an account. Log in below"
      });
    } else {
      Account.find({"nickname" : {$regex : ".*"+req.body.nickname+".*"}}, function(err, users){
        if(users.length > 0){
          var newNickname = req.body.nickname + "-" + (users.length + 1).toString();
        } else {
          var newNickname = req.body.nickname;
        }

        Account.register(new Account({
          firstname : req.body.firstname,
          lastname : req.body.lastname,
          nickname : newNickname,
          identifier : "account" + Date.now() + Math.floor((Math.random() * 10) + 1),
          username : req.body.username,
          einsteinPoints: 0, rupees: 0,
          ideaSeeds: []
        }), req.body.password, function(err, account) {
            if (err) {
                console.log("err.message:" + err.message);
                return res.render('pages/register', { account : account, message : err.message, csrfToken: req.csrfToken() });
            }

            passport.authenticate('local')(req, res, function () {
                res.redirect('/ideas/'+idea.body["idea-seed"] + '/nda');
            });
        });
      });
    }
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for registering new user for DSW denver startup week
******************************************************************
******************************************************************
*****************************************************************/
router.post('/register-dsw', csrfProtection, function(req, res) {
  req.body.nickname = req.body.nickname.trim();
  req.body.username = req.body.username.trim();
  
  Account.findOne({ 'username' : req.body.username  }, function(err, user) {
    if(user){
      return res.render('pages/login', {
        csrfToken: req.csrfToken(),
        showMessage : "You already have an account. Log in below"
      });
    } else {
      Account.find({"nickname" : {$regex : ".*"+req.body.nickname+".*"}}, function(err, users){
        if(users.length > 0){
          var newNickname = req.body.nickname + "-" + (users.length + 1).toString();
        } else {
          var newNickname = req.body.nickname;
        }


        // gets a default password value from jam profile page "itcrashed"
        Account.register(new Account({
          firstname : req.body.firstname,
          lastname : req.body.lastname,
          nickname : newNickname,
          identifier : "account" + Date.now() + Math.floor((Math.random() * 10) + 1),
          username : req.body.username,
          einsteinPoints: 0, rupees: 0,
          ideaSeeds: []
        }), req.body.password, function(err, account) {
            if (err) {
                console.log("err.message:" + err.message);
                return res.render('pages/register', { account : account, message : err.message, csrfToken: req.csrfToken() });
            }

            passport.authenticate('local')(req, res, function () {
                res.redirect('/jam/dsw');
            });
        });
      });

    }

  });
});



router.get('/login', csrfProtection, function(req, res) {
  res.render('pages/login', { csrfToken: req.csrfToken() });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for getting the login page for existing accounts
******************************************************************
******************************************************************
*****************************************************************/
router.get('/login/:loginStatus', csrfProtection, function(req, res) {
    if(req.params.loginStatus){
      if (req.params.loginStatus == "failed-login"){
        var message  = "Login failed. Please try again.";
      }
      res.render('pages/login', { user : req.user || {}, csrfToken: req.csrfToken(),
        showMessage : message
      });
    } else {
      res.render('pages/login', { user : req.user || {}, csrfToken: req.csrfToken() });
    }
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for getting forgot password page
******************************************************************
******************************************************************
*****************************************************************/
router.get('/forgot-password', csrfProtection, function(req, res) {
    res.render('pages/forgot-password', { user : req.user || {}, csrfToken: req.csrfToken() });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for getting reset password page
******************************************************************
******************************************************************
*****************************************************************/
router.get('/reset-password/:resetToken', csrfProtection, function(req, res) {
    res.render('pages/reset-password', { user : req.user || {}, csrfToken: req.csrfToken(), resetToken: req.params.resetToken});
});

router.get('/feedback', csrfProtection, function(req, res) {
    res.redirect('https://goo.gl/forms/XS5KfEcgD4DQR71C3');
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for registering resetting password
******************************************************************
******************************************************************
*****************************************************************/
router.post('/reset-password', csrfProtection, function(req, res) {
  Account.findOne({"resetToken" : req.body.resetToken}, function(err, account){

    if (err || !account){
      alert('Please try again or contact IdeaJam support to reset your password. Thank you!');
      res.redirect('/');
      return;
    }

    if (req.body.resetToken === account.resetToken) {
      account.setPassword(req.body.password, function(err, account) {
        if (err) {
          console.log("err.message:" + err.message);
          return res.render('pages/register', { account : account, message : err.message, csrfToken: req.csrfToken() });
        } else {
          account.save();
        }

        res.redirect('/');
      });
    } else {
      res.sendStatus(403);
      res.redirect('/');
    }
  });
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for getting the personal profile page
******************************************************************
******************************************************************
*****************************************************************/
router.get('/imagineer/:nickname', csrfProtection, function(req, res) {
  req.session.idea = null;
  var hasActiveMembership = false;
  var membershipDocument;

  var userNickname = req.params.nickname || req.user.nickname;
  if (!userNickname){
      console.log('Error is ' + err);
      res.redirect('/');
      return;
  }

  var generalJams = [];

  Account.find({"nickname" : userNickname}, function(err, accounts){

    if (err || accounts.length == 0){
      console.log('Error is ' + err);
      res.redirect('/');
      return;
    } else {
      var account = accounts[0];
    }

    ideaSeedHelpers.hasActiveMembership(account).then(function(membership){

      hasActiveMembership = membership["hasActiveMembership"];
      if(hasActiveMembership){
        membershipDocument = membership["membership"];
        membershipDocument['formattedStartDate'] = moment(membershipDocument['startDate']).format("MMM Do YYYY");
        membershipDocument['formattedEndDate'] = moment(membershipDocument['endDate']).format("MMM Do YYYY");
      }

      if(!account.identifier) {
        account.identifier = "account" + Date.now() + Math.floor((Math.random() * 10) + 1);
        account.save();
      }

      IdeaSeed.find({"collaborators" : account.username}, function(err, collaboratorIdeas){

        /* oh, this is a find all. this should change at some point */
        Network.find({}, function(err, networks){
          var masterSchoolNetworkList = [],
              schoolNetwork = "",
              masterCompanyNetworkList = [],
              companyNetwork = "",
              masterLocationNetworkList = [],
              locationNetwork = "";

          _.each(networks, function(element, index, list){
            if(element['type'] == 'school'){
              masterSchoolNetworkList.push(element);
              //get school name if it exists
              if(account.networks
                && account.networks['school']
                && account.networks['school'].toString() == element['id'].toString()){
                  schoolNetwork = element['name'];
              }
            }

            if(element['type'] == 'company'){
              masterCompanyNetworkList.push(element);
              //get company name if it exists
              if(account.networks
                && account.networks['company']
                && account.networks['company'].toString() == element['id'].toString()){
                  companyNetwork = element['name'];
              }
            }

            if(element['type'] == 'location'){
              masterLocationNetworkList.push(element);
              //get company name if it exists
              if(account.networks
                && account.networks['location']
                && account.networks['location'].toString() == element['id'].toString()){
                  locationNetwork = element['name'];
              }
            }

            if(req.user.otherNetworks && req.user.otherNetworks.indexOf(element.id) > -1 ){
              generalJams.push(element.name);
            }

          });
          Aptitude.find({"_id" : {$in : account.aptitudes}}, function(err, myAptitudes){
            var headshotData = ideaSeedHelpers.getUserHeadshot(req);
            var headshotURL = headshotData['headshotURL'];
            var headshotStyle = headshotData['headshotStyle'];

              var reviewNames, accountIdeaSeeds;
              var ideaNames = [],
                  j = 0;
              IdeaReview.find({"reviewer" : account.username}, function(err, reviews){
                var reviewIDs = _.map(reviews, function(item){return item["ideaSeedId"];});
                reviewIDs = _.filter(reviewIDs, Boolean);
                IdeaSeed.find({_id : {$in : reviewIDs}}, function(err, reviewedIdeas){
                  var creationDate, formattedDate, reviewedIdeaCreators = [];
                  _.each(reviewedIdeas, function(item){
                    creationDate = item._id.getTimestamp();
                    formattedDate = creationDate.getMonth().toString() + "-" +
                      creationDate.getDate().toString() + "-" +
                      creationDate.getFullYear().toString();
                    item['creationDate'] = formattedDate;
                    reviewedIdeaCreators.push(item["inventorName"]);
                  });

                  Account.find({"username" : {$in : reviewedIdeaCreators}}, function(err, reviewedIdeaCreatorObjects){
                    // figure out which account goes with with reviewed Idea
                    _.each(reviewedIdeas, function(ideaObject, ideaIndex){
                      _.each(reviewedIdeaCreatorObjects, function(account, accountIndex){
                        if(account.username == ideaObject.inventorName){
                          ideaObject['inventorName'] = account.nickname;
                        }
                      });
                      if(!ideaObject['inventorName']){
                        ideaObject['inventorName'] = "";
                      }
                    });
                    req.session.loginPath = "/imagineer/" + req.user.nickname;



                                      // find the idea seed documents that are created by the account showing in the profile
                                      var originalIdeaIds = _.map(account.ideaSeeds, function(item){return item.id;})
                                      IdeaSeed.find({_id : {$in : originalIdeaIds}}, function(err, originalIdeas){
                                        var creationDate;
                                        _.each(originalIdeas, function(item){
                                          creationDate = item._id.getTimestamp();
                                          formattedDate = creationDate.getMonth().toString() + "-" +
                                            creationDate.getDate().toString() + "-" +
                                            creationDate.getFullYear().toString();
                                          item['creationDate'] = formattedDate;
                                        });
                                        if(account.headshots[0]){
                                          var accountHeadshot = account.headshots[0];
                                          accountHeadshot.style = ideaSeedHelpers.getImageOrientation(accountHeadshot['orientation']);
                                          return res.render('pages/imagineers/imagineer', {
                                            csrfToken: req.csrfToken(),
                                            reviewNames : reviewedIdeas,
                                            reviewedIdeaCreatorObjects : reviewedIdeaCreatorObjects,
                                            headshot : headshotURL,
                                            headshotStyle : headshotStyle,
                                            hasActiveMembership : hasActiveMembership,
                                            user : req.user || {},
                                            profileAccount: account,
                                            collaboratorIdeas : collaboratorIdeas,
                                            accountHeadshot : accountHeadshot,
                                            membershipDocument : membershipDocument,
                                            generalJams : generalJams,
                                            aptitudes : myAptitudes,
                                            schoolNetwork : schoolNetwork,
                                            locationNetwork : locationNetwork,
                                            companyNetwork : companyNetwork,
                                            accountIdeaSeeds : originalIdeas || [],
                                            masterSchoolNetworkList : masterSchoolNetworkList,
                                            masterSchoolNetworkString : JSON.stringify(masterSchoolNetworkList)
                                                                    .replace(/\\n/g, "\\n")
                                                                    .replace(/'/g, "\\'")
                                                                    .replace(/"/g, '\\"')
                                                                    .replace(/\\&/g, "\\&")
                                                                    .replace(/\\r/g, "\\r")
                                                                    .replace(/\\t/g, "\\t")
                                                                    .replace(/\\b/g, "\\b")
                                                                    .replace(/\\f/g, "\\f")

                                          });
                                        } else {
                                          var accountHeadshot;
                                          return res.render('pages/imagineers/imagineer', {
                                            csrfToken: req.csrfToken(),
                                            reviewNames : reviewedIdeas,
                                            reviewedIdeaCreatorObjects : reviewedIdeaCreatorObjects,
                                            headshot : headshotURL,
                                            headshotStyle : headshotStyle,
                                            user : req.user || {},
                                            profileAccount: account,
                                            hasActiveMembership : hasActiveMembership,
                                            generalJams : generalJams,
                                            collaboratorIdeas : collaboratorIdeas,
                                            membershipDocument : membershipDocument,
                                            accountHeadshot : accountHeadshot,
                                            aptitudes : myAptitudes,
                                            schoolNetwork : schoolNetwork,
                                            locationNetwork : locationNetwork,
                                            companyNetwork : companyNetwork,
                                            accountIdeaSeeds : originalIdeas || [],
                                            masterSchoolNetworkList : masterSchoolNetworkList,
                                            masterSchoolNetworkString : JSON.stringify(masterSchoolNetworkList)
                                                                    .replace(/\\n/g, "\\n")
                                                                    .replace(/'/g, "\\'")
                                                                    .replace(/"/g, '\\"')
                                                                    .replace(/\\&/g, "\\&")
                                                                    .replace(/\\r/g, "\\r")
                                                                    .replace(/\\t/g, "\\t")
                                                                    .replace(/\\b/g, "\\b")
                                                                    .replace(/\\f/g, "\\f")

                                          });
                                        }
                                      });  
                  });
                });
              });
          }); //end of the aptitude query
        }); // End of Network query
      }); //end of collaborator idea seed query
    }); 
  }); // End of Account query
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for getting the profile picture, to put in the header bar
* for example
******************************************************************
******************************************************************
*****************************************************************/
router.get('/imagineer-dashboard', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  var myAptitudes, reviewedIdeaNames = [], ideaNames;
  var masterSchoolNetworkList = [],
      schoolNetwork = "",
      masterCompanyNetworkList = [],
      companyNetwork = "",
      masterLocationNetworkList = [],
      locationNetwork = "",
      generalJams = [],
      allExistingJams = [];

  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];
  var imageURLs = _.map(req.user.headshots, function(image){
    return ["id-"+image.filename, image.amazonURL];
  });


  /* oh, this is a find all. this should change at some point */
  Network.find({})
  .exec()
  .then(function(networks){

    _.each(networks, function(element, index, list){
      if(element['type'] == 'school'){
        masterSchoolNetworkList.push(element);
        //get school name if it exists
        if(req.user.networks
          && req.user.networks['school']
          && req.user.networks['school'].toString() == element['id'].toString()){
            schoolNetwork = element['name'];
        }
      }

      if(element['type'] == 'company'){
        masterCompanyNetworkList.push(element);
        //get company name if it exists
        if(req.user.networks
          && req.user.networks['company']
          && req.user.networks['company'].toString() == element['id'].toString()){
            companyNetwork = element['name'];
        }
      }

      if(element['type'] == 'location'){
        masterLocationNetworkList.push(element);
        //get company name if it exists
        if(req.user.networks
          && req.user.networks['location']
          && req.user.networks['location'].toString() == element['id'].toString()){
            locationNetwork = element['name'];
        }
      }

      if(req.user.otherNetworks && req.user.otherNetworks.indexOf(element.id) > -1 ){
        generalJams.push(element.name);
      }

      if(!element['type'] && generalJams.indexOf(element.name) == -1){
        allExistingJams.push(element.name);
      }
    });

  })
  .then(function(){
    return Aptitude.find({"_id" : {$in : req.user.aptitudes}}).exec();
  })
  .then(function(aptitudes){
    myAptitudes = aptitudes;
    return IdeaReview.find({"reviewer" : req.user.username}).exec();
  })
  .then(function(reviews){
    if(reviews && reviews.length > 0){
      var ideaSeedIDs = _.map(reviews, function(item){return item["ideaSeedId"];});
      ideaSeedIDs = _.filter(ideaSeedIDs, Boolean);
      //if there are any reviews by this user, list them here
      return IdeaSeed.find({_id : {$in : ideaSeedIDs}}).exec();
    } else{
      return Promise.resolve();
    }
  })
  .then(function(reviewedIdeas){
    if(reviewedIdeas && reviewedIdeas.length > 0){
      var creationDate, formattedDate;
      reviewedIdeaNames = _.map(reviewedIdeas, function(item){
        creationDate = item._id.getTimestamp();
        formattedDate = creationDate.getMonth().toString() + "-" +
          creationDate.getDate().toString() + "-" +
          creationDate.getFullYear().toString();
        return [item["name"], formattedDate];
      });
    }

    var ideaSeedIDs = _.map(req.user.ideaSeeds, function(item){return item["_id"];});
    ideaSeedIDs = _.filter(ideaSeedIDs, Boolean);
    //if there are any reviews by this user, list them here
    return IdeaSeed.find({_id : {$in : ideaSeedIDs}}).exec();
  })
  .then(function(originalIdeas){
    if(originalIdeas.length > 0){
      var creationDate, formattedDate;
      ideaNames = _.map(originalIdeas, function(item){

        creationDate = item._id.getTimestamp();
        formattedDate = creationDate.getMonth().toString() + "-" +
          creationDate.getDate().toString() + "-" +
          creationDate.getFullYear().toString();
        return [item["name"], formattedDate];
      });
    }
    res.render('pages/imagineers/imagineer-dashboard', {
      csrfToken: req.csrfToken(),
      user : req.user || {},
      aptitudes : myAptitudes,
      reviewNames : reviewedIdeaNames,
      accountIdeaSeeds : ideaNames,
      schoolNetwork : schoolNetwork,
      locationNetwork : locationNetwork,
      companyNetwork : companyNetwork,
      generalJams : generalJams,
      allExistingJams : JSON.stringify(allExistingJams)
                          .replace(/\\n/g, "\\n")
                          .replace(/'/g, "\\'")
                          .replace(/"/g, '\\"')
                          .replace(/\\&/g, "\\&")
                          .replace(/\\r/g, "\\r")
                          .replace(/\\t/g, "\\t")
                          .replace(/\\b/g, "\\b")
                          .replace(/\\f/g, "\\f"),
      headshotIDs : imageURLs,
      headshotStyle : headshotStyle,
      headshot : headshotURL
    });
  })
  .catch(function(err){
    // just need one of these
    console.log('error:', err);
  });
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for getting the profile activity history
******************************************************************
******************************************************************
*****************************************************************/
router.get('/imagineer/:nickName/archive', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  /* oh, this is a find all. this should change at some point */
  Log.find({"user" : req.user.id})
  .exec()
  .then(function(logEntries){

    _.each(logEntries, function(entry, index){
      entry['formattedDate'] = moment(entry['date']).format("MMM Do YYYY");
    });

    res.render('pages/imagineers/imagineer-archive', {
      csrfToken: req.csrfToken(),
      user : req.user || {},
      logs : logEntries
    });
  })
  .catch(function(err){
    // just need one of these
    console.log('error:', err);
  });

});


/*****************************************************************
******************************************************************
******************************************************************
* Route for viewing all the ideas in the system
******************************************************************
******************************************************************
*****************************************************************/
router.get('/ideas', csrfProtection, function(req, res){
  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];


      IdeaSeed.find({"name" : {$exists : true}}).sort({$natural: -1})
        .exec(function(err, ideas){
        var wasteValueScores = [0, 0];

        var totalReviewList = [];
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


          _.each(ideas, function(anIdea, index){
            if(Object.keys(reviewScores).indexOf(anIdea.id.toString()) == -1){
              reviewScores[anIdea.id.toString()] = 0;
            }
          });

          //get the first image for each idea for now
          var imageList = _.map(ideas, function(idea){
            return idea.images[0];
          });

          IdeaImage.find({"_id" : { $in : imageList}}, function(err, images){
            if(err){ console.log("error is " + err)}
            var currentImage;
            var currentImageStyle;
            var ideaList = _.map(ideas, function(idea){
              if(idea.visibility == "public"){
                reviewScores[idea.id.toString()] = Math.round(reviewScores[idea.id.toString()]);

                //get the image document corresponding to the first image ID
                // for each individual idea
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
                  }
                }
                var blockDescription = idea.name.charAt(0).toUpperCase() + idea.name.slice(1) + " solves the problem of " + idea.problem + " by " + idea.description + ".";
                return [
                  idea['name'], //String
                  blockDescription, //String
                  reviewScores[idea.id.toString()], //array of two numbers
                  idea['inventorName'],
                  currentImage,
                  currentImageStyle
                ];
              }
            });

            ideaList = _.filter(ideaList, Boolean)

            var inventorList = _.map(ideaList, function(idea){
              return idea[3];
            })

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
                            ideaList[j].push("");
                            ideaList[j].push("");
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

                    res.render('pages/ideas/ideas', {
                      csrfToken: req.csrfToken(),
                      user : req.user || {} || {},
                      headshot : headshotURL,
                      headshotStyle : headshotStyle,
                      ideas : ideaList,
                      reviewScores : reviewScores
                    });
              }
            );
          });
        });
      }); //end of idea seed query
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for the first page of starting a new idea seed. This is
* the first page the user sees when they click the button to
* begin a new idea
******************************************************************
******************************************************************
*****************************************************************/
router.get('/introduce-idea/new', csrfProtection, function(req, res) {
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];

  req.session.idea = null;

  res.redirect('/introduce-idea');

});



/*****************************************************************
******************************************************************
******************************************************************
* Route for the first page of starting a new idea seed. This is
* the first page the user sees when they click the button to
* begin a new idea
******************************************************************
******************************************************************
*****************************************************************/
router.get('/introduce-idea', csrfProtection, function(req, res) {
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];

      if(!req.session.idea) {
        var newIdea = new IdeaSeed({inventorName : req.user.username});
        newIdea.save();
        Account.update(
          { _id : req.user.id },
          { $push : { ideaSeeds : newIdea }},
          function(err, raw){
            console.log('The raw response from Mongo was ', raw);
          }
        );
        req.session.idea = newIdea._doc._id.toHexString();
        res.render('pages/ideas/introduce-idea', { user : req.user || {}, idea : req.session.idea, csrfToken: req.csrfToken() });
      } else {
        IdeaSeed.findById(req.session.idea,function(err, idea){
          currentIdea = idea._doc;
          res.render('pages/ideas/introduce-idea', { user : req.user || {},
            csrfToken: req.csrfToken(),
            headshot : headshotURL,
            headshotStyle : headshotStyle,
            idea : currentIdea });
        });
      }
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for saving data from the initial idea seed page. This is
* the first page the user sees when they click the button to
* begin a new idea
******************************************************************
******************************************************************
*****************************************************************/
router.post('/introduce-idea', csrfProtection, function(req, res) {
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  if(!req.session.idea){
    res.redirect('/');
    return;
  }

  req.body.purposeFor = req.body.purposeFor.trim();
  IdeaSeed.update({_id : req.session.idea}, {
    problem : req.body.purposeFor.slice(15)},
    { multi: false }, function (err, raw) {
      if (err) return handleError(err);
      Account.findById( req.user.id,
        function (err, account) {
          account.einsteinPoints = account.einsteinPoints + 5;
          today = ideaSeedHelpers.getCurrentDate();
          if(account.einsteinHistory){
            account.einsteinHistory.push("You earned 5 Einstein Points on " + today + " by adding a challenge for your idea.");
          } else {
            account.einsteinHistory = ["You earned 5 Einstein Points on " + today + " by adding a challenge for your idea."];
          }
          account.save(function (err) {});
      });
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/accomplish');
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for the second page of starting a new idea seed. Just
* renders the page with data.
******************************************************************
******************************************************************
*****************************************************************/
router.get('/accomplish', csrfProtection, function(req, res) {
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];


    IdeaSeed.findById(req.session.idea,function(err, idea){
      currentIdea = idea._doc;
      res.render('pages/ideas/accomplish', { user : req.user || {},
        csrfToken: req.csrfToken(),
        headshot: headshotURL,
        headshotStyle : headshotStyle,
        idea : currentIdea });
    });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for the second page of starting a new idea seed. This
* saves the information entered by the user.
******************************************************************
******************************************************************
*****************************************************************/
router.post('/accomplish', csrfProtection, function(req, res) {
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  if(!req.session.idea){
    res.redirect('/');
  }

  req.body.purposeHow = req.body.purposeHow.trim();
  IdeaSeed.findByIdAndUpdate(req.session.idea, {
    description : req.body.purposeHow.slice(16)},
    { multi: false }, function (err, document) {
      console.log('The raw response from Mongo was ', document);
      Account.findById( req.user.id,
        function (err, account) {
          account.einsteinPoints = account.einsteinPoints + 5;
          today = ideaSeedHelpers.getCurrentDate();
          if(account.einsteinHistory){
            account.einsteinHistory.push("You earned 5 Einstein Points on " + today + " by adding a solution for your idea.");
          } else {
            account.einsteinHistory = ["You earned 5 Einstein Points on " + today + " by adding a solution for your idea."];
          }
          account.save(function (err) {});
      });
      res.redirect("/ideas/yet-to-be-named/edit");
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for saving suggestions entered by a user on the suggestion
* summary page.
******************************************************************
******************************************************************
*****************************************************************/
router.post('/suggestion-submit', csrfProtection, function(req, res) {
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  var problemArea = req.body.problemType.split("-")[0];
  var contributor = req.body.problemType.split("-")[1];
  var problemText = req.body.problemType.split("-")[2];

  IdeaProblem.findOne({
    "problemArea" : problemArea,
    "creator"     : contributor,
    "text"        : problemText
  }, function(err, problem){

    var newSuggestion = {
      descriptions : [req.body.suggestion.slice(16)], //getting rid of "the solution of "
      hindsight : req.body.hindsight.slice(14), //getting rid of "in hindsight, "
      foresight : req.body.foresight.slice(14), //getting rid of "in foresight, "
      outsight : req.body.outsight.slice(13), //getting rid of "in outsight, "
      category : req.body.suggestionCategory,
      creator : req.user.username,
      ideaSeed : req.session.idea,
      problemID : problem.id,
      date: Date.now(),
      identifier : "comp-"+Date.now() + Math.floor((Math.random() * 10) + 1)
    };

    Account.findById( req.user.id,
      function (err, account) {
        var points = parseInt(req.body.pointValue.slice(1));
        account.einsteinPoints = account.einsteinPoints + points;
        today = ideaSeedHelpers.getCurrentDate();
        if(account.einsteinHistory){
          account.einsteinHistory.push("You earned " + points + " Einstein Points on " + today + " by making a suggestion to an idea.");
        } else {
          account.einsteinHistory = ["You earned " + points + " Einstein Points on " + today + " by making a suggestion to an idea."];
        }
        account.save(function (err) {});
    });

    Component.create(newSuggestion,
      function(err, raw){
        console.log('The raw response from Mongo was ', raw);
        res.redirect('/suggestion-summary');
      }
    );

  });
});

router.post('/suggestion-submit-new', csrfProtection, function(req, res) {
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  var problemArea = req.body.problemArea;
  var contributor = req.body.problemContributor;
  var problemText = req.body.problemText;

  var suggestionTactic = req.body.tactic;
  var suggestionTarget = req.body.target;
  var suggestionCategory = IdeaSeed.getCategoryAbbreviatedName(suggestionTactic, suggestionTarget);

  IdeaProblem.findOne({
    "problemArea" : problemArea,
    "creator"     : contributor,
    "text"        : problemText
  }, function(err, problem){

    if(!problem.ideaSeed){
      res.redirect('/');
      return;
    }

    var ideaSeedId = req.session.idea || problem.ideaSeed;

    var newSuggestion = {
      descriptions : [req.body.suggestionText.slice(3)], //getting rid of "by "
      category : suggestionCategory,
      creator : req.user.username,
      ideaSeed : ideaSeedId,
      problemID : problem.id,
      date: Date.now(),
      identifier : "comp-"+Date.now() + Math.floor((Math.random() * 10) + 1)
    };


    if(req.body.filename){
      IdeaImage.find({"filename" : {$regex : ".*"+req.body.filename+".*"}}, function(err, images){

        var newFileName = req.body.filename + "-" + (images.length + 1).toString();

        var image = new IdeaImage({ imageMimetype : req.body.type,
          filename : newFileName, uploader : req.user.username, amazonURL : req.body.fileUrl });
        image.save(function(err, newImage){
          if (err) {
            console.log(err);
          } else {
            newSuggestion["mainImage"] =  newImage.id;
            Account.findById( req.user.id,
              function (err, account) {
                var points = parseInt(req.body.points);
                account.einsteinPoints = account.einsteinPoints + points;
                today = ideaSeedHelpers.getCurrentDate();
                if(account.einsteinHistory){
                  account.einsteinHistory.push("You earned " + points + " Einstein Points on " + today + " by making a suggestion to an idea.");
                } else {
                  account.einsteinHistory = ["You earned " + points + " Einstein Points on " + today + " by making a suggestion to an idea."];
                }
                account.save(function (err) {});
            });
            Component.create(newSuggestion,
              function(err, raw){
                console.log('The raw response from Mongo was ', raw);
                res.sendStatus(200);
              }
            );
          }
        });
      });
    } else {
      Account.findById( req.user.id,
        function (err, account) {
          var points = parseInt(req.body.points);
          account.einsteinPoints = account.einsteinPoints + points;
          today = ideaSeedHelpers.getCurrentDate();
          if(account.einsteinHistory){
            account.einsteinHistory.push("You earned " + points + " Einstein Points on " + today + " by making a suggestion to an idea.");
          } else {
            account.einsteinHistory = ["You earned " + points + " Einstein Points on " + today + " by making a suggestion to an idea."];
          }
          account.save(function (err) {});
      });
      Component.create(newSuggestion,
        function(err, raw){
          console.log('No photo uploaded, raw response: ', raw);
          res.sendStatus(200);
        }
      );
    }
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for updating the points in the suggestion table on the fly
* when a user saves a new suggestion.
******************************************************************
******************************************************************
*****************************************************************/
router.get('/update-suggestion-points/:problemAuthor', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  if(!req.session.idea){
    res.redirect('/');
    return;
  }

  var problemArea = req.params.problemAuthor.split("-")[0];
  var contributor = req.params.problemAuthor.split("-")[1];
  var problemText = req.params.problemAuthor.split("-")[2];

  IdeaProblem.findOne({
    "problemArea" : problemArea,
    "creator"     : contributor,
    "text"        : problemText
  }, function(err, problem){

    Component.find({
      "ideaSeed" : req.session.idea,
      "problemID" :  problem.id
    }, function(err, components){

      var categorizedSuggestions = {};
      for(var i = 0; i < components.length; i++){
        if(components[i].category && categorizedSuggestions[components[i].category]){
          categorizedSuggestions[components[i].category].push(components[i]);
        } else if (components[i].category && !categorizedSuggestions[components[i].category]){
          categorizedSuggestions[components[i].category] = [components[i]];
        }
      }
      var categoryPointValues = Component.getCategoryPointValues(categorizedSuggestions);

      if(req.session.ideaReview){ var reviewing = true; }
      else { var reviewing = false; }

      res.json(categoryPointValues);

    });

  });

});

/*****************************************************************
******************************************************************
******************************************************************
* Upvote imperfection and suggestion
******************************************************************
******************************************************************
*****************************************************************/

router.post('/upvote-imperfection', csrfProtection, function(req, res) {
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  var problemId = req.body.problem;

  IdeaProblem.findById(problemId,
    function (err, problem) {
      if(problem.upvotes.indexOf(req.user.id) == -1) {
        problem.upvotes.push(req.user.id);
        problem.save(function (err) {});
      }
  });

  res.sendStatus(200);
});

router.post('/upvote-suggestion', csrfProtection, function(req, res) {
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  var suggestionId = req.body.suggestion;

  Component.findById(suggestionId,
    function (err, component) {
      if(component.upvotes.indexOf(req.user.id) == -1) {
        component.upvotes.push(req.user.id);
        component.save(function (err) {});
      }
  });

  res.sendStatus(200);
});

/*****************************************************************
******************************************************************
******************************************************************
* I have to look up where this is used.
******************************************************************
******************************************************************
*****************************************************************/
router.get('/update-suggestion-list/:problem', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  req.session.problemType = req.params.problem;
  res.sendStatus(200);
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for saving new idea seed name
******************************************************************
******************************************************************
*****************************************************************/
router.post('/save-idea-name', csrfProtection, function(req, res) {
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  IdeaSeed.findOneAndUpdate({_id : req.session.idea}, {
    name : req.body.inventionName.slice("My idea is called the ".length)},
    // options, this gets the new updated record
    { multi: false, new : true },
    function (err, idea) {
      Account.findById( req.user.id,
        function (err, account) {
          account.einsteinPoints = account.einsteinPoints + 5;
          today = ideaSeedHelpers.getCurrentDate();
          if(account.einsteinHistory){
            account.einsteinHistory.push("You earned 5 Einstein Points on " + today + " by giving your idea a title.");
          } else {
            account.einsteinHistory = ["You earned 5 Einstein Points on " + today + " by giving your idea a title."];
          }
          account.save(function (err) {});
      });

      console.log('The raw response from Mongo was ', idea);
      res.json({"newUrl" : '/ideas/' + idea.name + "/edit"});
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for updating the slider values in the modal to view all
* sliders
******************************************************************
******************************************************************
*****************************************************************/
router.get('/get-all-viability-scores', csrfProtection, function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
    // this is if the inventor is the same as the session user
    // enters info into the ideaSeed model vs the ideaReview model
    if(thisIdea.inventorName == req.user.username){
      res.json(thisIdea._doc);
    } else {
      IdeaReview.findOne(
        {"reviewer" : req.user.username, "ideaSeedId" : req.session.idea},
        function(error, currentReview){
        if(error){
          console.error('ERROR! ' + error);
          res.json({});
        } else if (currentReview){
          req.session.ideaReview = currentReview;
          res.json(currentReview._doc);
        } else {
          var newReview = {
            ideaSeedId : req.session.idea,
            reviewer : req.user.username
          }
          IdeaReview.create(newReview, function(err, newReview){
            if(err) { console.log("new review not created correctly")}
            thisIdea.ideaReviews.push(newReview.id);
            thisIdea.save(function(err, updatedIdea){
              req.session.ideaReview = newReview;
              res.json(newReview._doc);
            });
          });
        }
      });
    }
  });
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for saving the values of the viability sliders
******************************************************************
******************************************************************
*****************************************************************/
router.post('/update-all-viabilities', csrfProtection, function(req, res) {
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
    // this is if the inventor is the same as the session user
    // enters info into the ideaSeed model vs the ideaReview model
    if(thisIdea.inventorName == req.user.username){
      _.each(req.body, function(value, key){
        thisIdea[key] = value;
      });

      thisIdea.save(function (err, idea, numaffected) {
        if(err) {
            console.error('ERROR!' + err);
        }
        res.sendStatus(200);
      });

    } else if( req.session.ideaReview) {

      IdeaReview.findById( req.session.ideaReview._id, function(error, currentReview){
        if(error){
          console.error('ERROR! ' + error);
          res.json({});
        } else {
          _.each(req.body, function(value, key){
            currentReview[key] = value;
          });

          currentReview.save(function (err, review, numaffected) {
            if(err) {
                console.error('ERROR!' + err);
            }
            res.sendStatus(200);
          });
        }
      });

    } else {
      var ideaReview = new IdeaReview({
        reviewer : req.user.username,
        ideaSeedId : req.session.idea
      });

      _.each(req.body, function(value, key){
        ideaReview[key] = value;
      });

      ideaReview.save(function(err, newReview){
        if (err) {
          console.log(err);
        } else {
          IdeaSeed.findOneAndUpdate(
              { _id : req.session.idea },
              { $push : { ideaReviews : newReview.id } },
              function(err, idea){
                console.log('The raw response from Mongo was ', idea);
                req.session.ideaReview = newReview.id;
                res.sendStatus(200);
              }
          );
        }
      });
    } 
  });
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for the image upload screen
******************************************************************
******************************************************************
*****************************************************************/
router.get('/image-upload', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];
  var canEdit;

    IdeaSeed.findById(req.session.idea,function(err, idea){
      var imageURLs = [];
      IdeaImage.find({"_id" : {$in : idea.images}}, function(err, imageDocuments){
        _.each(imageDocuments, function(image, index){
          var filename = image["filename"];
          var imageStyle = "";
          imageStyle = ideaSeedHelpers.getImageOrientation(image["orientation"]);
          imageURLs.push([
            filename,
            image["amazonURL"],
            image._doc["uploader"],
            imageStyle
          ]);
        });

        if(req.user.username == idea.inventorName || idea.collaborators.indexOf(req.user.username) > -1 ){
          canEdit = true;
        }

        res.render('pages/ideas/image-upload', {
          csrfToken: req.csrfToken(),
          user : req.user || {},
          headshot: headshotURL,
          headshotStyle : headshotStyle,
          idea : idea,
          canEdit : canEdit,
          imageURLs : imageURLs
        });
      });
    });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for saving a new image
******************************************************************
******************************************************************
*****************************************************************/
router.post('/image-upload', csrfProtection, function(req, res) {
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

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
        res.json({"error" : err});
        return;
      } else {
        IdeaSeed.update(
            { _id : req.session.idea },
            { $push : { images : newImage.id }},
            function(err){
              if (err) return handleError(err);
              Account.findById( req.user.id,
                function (err, account) {
                  account.einsteinPoints = account.einsteinPoints + 25;
                  today = ideaSeedHelpers.getCurrentDate();
                  if(account.einsteinHistory){
                    account.einsteinHistory.push("You earned 25 Einstein Points on " + today + " by adding an image to your idea.");
                  } else {
                    account.einsteinHistory = ["You earned 25 Einstein Points on " + today + " by adding an image to your idea."];
                  }
                  account.save(function (err) {});
              });
              res.json({"redirectURL" : '/image-upload'});
              return;
            }
        );
      }
    });

  }); //end of idea image query
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for saving a new application receipt
******************************************************************
******************************************************************
*****************************************************************/
router.post('/receipt-upload', csrfProtection, function(req, res) {

    IdeaImage.find({"filename" : {$regex : ".*"+req.body.filename+".*"}}, function(err, images){

      var newFileName = req.body.filename + "-" + (images.length + 1).toString();

      var image = new IdeaImage({ imageMimetype : req.body.type,
        filename : newFileName, uploader : req.user.username, amazonURL : req.body.fileUrl });

      if(req.body["exif[Orientation]"]){
        image.orientation = parseInt(req.body["exif[Orientation]"]);
      }
      image.save(function(err, newReceipt){
        if (err) {
          console.log(err);
        } else {
          IdeaSeed.update(
              { _id : req.session.idea },
              { $set : {
                applicationReceipt : newReceipt.id,
                visibility : "public"
              }},
              function(err, raw){
                console.log('The raw response from Mongo was ', raw);
                res.sendStatus(200);
              }
          );
        }
      });

    }); //end of idea image query
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for saving an annotation on the image annotation page
******************************************************************
******************************************************************
*****************************************************************/
router.post('/save-annotations', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
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

/*****************************************************************
******************************************************************
******************************************************************
* Route for rendering the suggestion point table
******************************************************************
******************************************************************
*****************************************************************/
router.get('/suggestion-summary', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];

    IdeaSeed.findById(req.session.idea,function(err, idea){
      currentIdea = idea._doc;

      IdeaProblem.find({"_id" : { $in : idea.problemPriorities}}, function(err, problems){

        if (problems.length > 0) {
          var problemIds = _.map(problems, function(item){ return item.id;});
          var sortedProblems = [];
          for(var k = 0; k < problemIds.length; k++){
            //get the priority for each ID
            sortedProblems[idea.problemPriorities.indexOf(problemIds[k])] = problems[k];
          }

          var firstProblemIndex = problemIds.indexOf(idea.problemPriorities[0].toString());
          var firstProblemText = problems[firstProblemIndex]['text'];

          Component.find({
            'ideaSeed' : idea.id,
            'problemID' : problems[firstProblemIndex]['id']
          }, function(err, components){

            var categorizedSuggestions = {};
            for(var i = 0; i < components.length; i++){
              if(components[i].category && categorizedSuggestions[components[i].category]){
                categorizedSuggestions[components[i].category].push(components[i]);
              } else if (components[i].category && !categorizedSuggestions[components[i].category]){
                categorizedSuggestions[components[i].category] = [components[i]];
              }
            }
            var categoryPointValues = Component.getCategoryPointValues(categorizedSuggestions);

            if(req.session.ideaReview){ var reviewing = true; }
            else { var reviewing = false; }


            res.render('pages/suggestion-summary', { user : req.user || {}, idea : currentIdea,
              csrfToken: req.csrfToken(),
              problems : sortedProblems, categoryPoints : categoryPointValues,
              headshot : headshotURL,
              headshotStyle : headshotStyle,
              firstProblemText : firstProblemText, reviewing : reviewing
            });
          });
        } else {
          if(req.session.ideaReview){ var reviewing = true; }
          else { var reviewing = false; }
          res.render('pages/suggestion-summary', { user : req.user || {}, idea : currentIdea,
            csrfToken: req.csrfToken(),
            problems : [], categoryPoints : {}, headshot : headshotURL,
            headshotStyle : headshotStyle,
            firstProblemText : "", reviewing : reviewing
          });
        }
      });
    });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for rendering the page to create a new variant
******************************************************************
******************************************************************
*****************************************************************/
router.get('/create-new-variant', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];

    IdeaSeed.findById(req.session.idea,function(err, idea){

      Component.find({"ideaSeed" : idea.id}, function(err, components){

        var suggestionsList = []; //build components by category
        var imagesAndComponents = {}; //build list of components within each imageID key
        //not sure about components with no image or category yet
        var headshotNames = [];

        for(var i = 0; i < components.length; i++){
          //break into two lists, one for components with no images, and on for those with
          if(components[i].images.length == 0){
            suggestionsList.push(components[i]);
          } else {
            for(var k=0; k < components[i].images.length; k++){
              if(imagesAndComponents[components[i].images[k]['imageID'].toString()]){
                imagesAndComponents[components[i].images[k]['imageID'].toString()].push(components[i]);
              } else {
                imagesAndComponents[components[i].images[k]['imageID'].toString()] = [components[i]];
              }
            }
          }
          if( headshotNames.indexOf(components[i]['creator']) == -1 ){
            headshotNames.push(components[i]['creator']);
          }
        }

        if(req.session.ideaReview){ var reviewing = true; }
        else { var reviewing = false; }

        IdeaImage.find({"_id" : {$in : Object.keys(imagesAndComponents)}}, function(err, images){
          var imageList = _.map(images, function(image){
            var imageStyle = "";
            imageStyle = ideaSeedHelpers.getImageOrientation(image["orientation"]);
            return [image["filename"], image["uploader"], image["id"], [], image["amazonURL"], imageStyle];
          });

          for(var i = 0; i < imageList.length; i++){
            imageList[i][3] = _.map(imagesAndComponents[imageList[i][2]], function(component){
              return [component['number'], component['text']];
            });
          }

          //get component creator and image uploader profile headshots
          Account.find({"username" : {$in : headshotNames}}, function(err, contributors){

            var headshotIDs = _.map(contributors, function(contributor){
              if(contributor.headshots && contributor.headshots[0]){
                return contributor.headshots[0];
              } else {
                return false;
              }
            });
            headshotIDs = _.filter(headshotIDs, function(id){return id;});

            IdeaImage.find({"_id" : {$in : headshotIDs}}, function(err, headshots){
              var headshotURLs = {};
              for(var j = 0; j < headshots.length; j++){
                headshotURLs[headshots[j]['uploader']] = [headshots[j]["amazonURL"]];
                imageStyle = ideaSeedHelpers.getImageOrientation(headshots[j]["orientation"]);
                headshotURLs[headshots[j]['uploader']].push(imageStyle);
              }

              currentIdea = idea._doc;
              res.render('pages/ideas/new-variant', {
                csrfToken: req.csrfToken(),
                user : req.user || {}, //user document
                idea : currentIdea, //document
                images : imageList, //[[imagename, uploader, objectid, [componentNumber, componentText  ]]]
                headshotURLs : headshotURLs,
                headshotStyle : headshotStyle,
                suggestionsList : suggestionsList, //special structure
                imagesAndComponents : imagesAndComponents,
                headshot : headshotURL,
                reviewing : reviewing
              });
            });
          }); //end of contributor account lookup
        });
      }); //end of component query
    });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/sort-problems', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];

    IdeaSeed.findById(req.session.idea,function(err, idea){
      IdeaProblem.find({"_id" : { $in : idea.problemPriorities}}, function(err, problems){

        var problemIds = _.map(problems, function(item){ return item.id;});
        var sortedProblems = [];
        for(var k = 0; k < problemIds.length; k++){
          //get the priority for each ID
          sortedProblems[idea.problemPriorities.indexOf(problemIds[k])] = problems[k];
        }

        if(req.session.ideaReview){ var reviewing = true; }
        else { var reviewing = false; }


        res.render('pages/sort-problems', { user : req.user || {}, idea : idea._doc,
          csrfToken: req.csrfToken(),
          headshot : headshotURL, headshotStyle : headshotStyle,
          problems : sortedProblems });
      });
    });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for saving a new order of problems
******************************************************************
******************************************************************
*****************************************************************/
router.post('/order-problems', csrfProtection, function(req, res) {
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  IdeaSeed.findById(req.session.idea, function(err, idea){

    var length = Object.keys(req.body).length;
    var problemTexts = [];
    var problemAreas = [];


    for(var key in req.body){
      problemTexts[key] = req.body[key].split(" : ")[2];
      problemAreas[key] = req.body[key].split(" : ")[0] + " : " + req.body[key].split(" : ")[1];

    }

      IdeaProblem.find({"ideaSeed" : idea.id},
        function(err, problems){

          idea.problemPriorities = [];

          for(var i = 0; i < problems.length; i++){
            idea.problemPriorities[problemTexts.indexOf(problems[i].text)] = problems[i].id.toString();
          }

          idea.save(function (err, idea, numaffected) {
              if(err) {
                  console.error('ERROR!' + err);
              }
              res.sendStatus(200);
          });
      });
  });
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for saving a new suggestion
* This has the effect of building a new variant.
******************************************************************
******************************************************************
*****************************************************************/
router.post('/approve-suggestions', csrfProtection, function(req, res) {
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  if(!req.session.idea){
    res.redirect('/');
    return;
  }

  var suggestionIDs = _.map(req.body, function(value, key){
    if(key == "_csrf"){
      return false;
    } else {
      return key;
    }
  });

  suggestionIDs = _.filter(suggestionIDs, Boolean);

  Component.update(
    {"identifier" : { $in : suggestionIDs}},
    {$set:{
      inventorApproved : true
    }},function(err, results){
      //give 100 points to people who contributed suggestions. this is kind
      // of an inefficient way, but not sure how to do it simpler right now
      Component.find({ "identifier" : {$in : suggestionIDs}}, function(err, suggestions){
        var suggestors = _.map(suggestions, function(oneSugg, suggIndex){
          return oneSugg.creator;
        })
        _.each(suggestors, function(oneSuggestor, suggestorIndex){
          Account.findOne({"username" : oneSuggestor}, function(err, account)
          {
            if(account){
              account.einsteinPoints = account.einsteinPoints + 100;
              today = ideaSeedHelpers.getCurrentDate();
              if(account.einsteinHistory){
                account.einsteinHistory.push("You earned 100 Einstein Points on " + today + " by having one of your suggestions accepted by another inventor.");
              } else {
                account.einsteinHistory = ["You earned 100 Einstein Points on " + today + " by having one of your suggestions accepted by another inventor."];
              }
              account.save(function (err) {});
            }
          });
        })
      })
      res.sendStatus(200);
  });

});

/*****************************************************************
******************************************************************
******************************************************************
* Route for removing a denied suggestion
******************************************************************
******************************************************************
*****************************************************************/
router.post('/remove-suggestion', csrfProtection, function(req, res) {
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  if(!req.session.idea){
    res.redirect('/');
    return;
  }

  if(req.body['remove-suggestion']){
    Component.update(
      {"identifier" : req.body['remove-suggestion']},
      {$set:{
        inventorApproved : false
      }},function(err, results){
        res.sendStatus(200);
    });
  } else {
    res.sendStatus(200);
  }


});


/*****************************************************************
******************************************************************
******************************************************************
* Route for saving a new suggestion
* This has the effect of building a new variant.
******************************************************************
******************************************************************
*****************************************************************/
router.post('/incorporate-suggestions', csrfProtection, function(req, res) {
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  IdeaSeed.findById(req.session.idea, function(err, idea){
    currentIdea = idea._doc;
    var newVariantName = "",
        incorporatedSuggestions = [],
        incorporatedImages = [],
        newVariant = {};

    newVariantName = IdeaSeed.generateVariantName(currentIdea.name);
    newVariant["name"] = newVariantName;

    for(var suggestion in req.body){
      if(req.body[suggestion] == "incorporate"){
        //all images in the variant form have a name that starts with image-
        //so we put those in the image list and assume the rest are suggestions
        if(suggestion.substring(0,6) == "image-"){
          incorporatedImages.push(suggestion.slice(6));
        } else {
          incorporatedSuggestions.push(suggestion);
        }
      }
    }

    //suggestion query
    Component.find({"_id" : {$in : incorporatedSuggestions}}, function(err, suggestions){
      //this query is for components that are annotations of images included in the variant.
      Component.find({"images.imageID" : {$in : incorporatedImages}}, function(err, components){

        for(var k = 0; k < components.length; k++){
          if(incorporatedSuggestions.indexOf(components[k]['id']) == -1){
            incorporatedSuggestions.push(components[k]['id']);
          }
        }

        newVariant.contributorsSignedOff = {};
        newVariant.contributorContracts = {};

        var suggestionCreatorUsernames = _.map(suggestions, function(element, index){ return element.creator; });
        Account.find({"username" : { $in : suggestionCreatorUsernames}}, function(err, accounts){
          _.each(accounts, function(account, index){
            newVariant.contributorsSignedOff[account.identifier] = "No Email Sent";
            newVariant.contributorContracts[account.identifier] = "no contract yet";
          })

          //this tells mongoose to save the mixed field of contributors
          // when save is called below
          newVariant["components"] = incorporatedSuggestions;
          newVariant["images"] = incorporatedImages;

          IdeaSeed.update(
             { _id: idea.id },
             { $push: { variants: newVariant } },
            function(err, data){
              if (err){
                console.log("error is "+ err)
              }
              res.redirect('/ideas/' + idea.name);
            }
          );      
        })
      });
    }); //end of suggestion query
  });
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for logging in using the passport library
******************************************************************
******************************************************************
*****************************************************************/
router.post('/login', csrfProtection, function(req,res, next){
    passport.authenticate('local', function(err, user, info) {
      if (err) { return next(err); }
      if (!user) {
        return res.redirect('/login/failed-login');
      }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        if (req.session.loginPath){
          return res.redirect(req.session.loginPath);
        } else {
          return res.redirect('/imagineer/' + user.nickname);  
        }
        
      });
    })(req, res, next);

});


router.post('/login-jam', csrfProtection, function(req,res, next){
    passport.authenticate('local', function(err, user, info) {
      if (err) { return next(err); }
      if (!user) {
        return res.redirect('/login/failed-login');
      }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.redirect('/view-jams');
      });
    })(req, res, next);

});

router.post('/login-nda', csrfProtection, function(req,res, next){
    passport.authenticate('local', function(err, user, info) {
      if (err) { return next(err); }
      if (!user) {
        return res.redirect('/login/failed-login');
      }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.redirect('/ideas/' + req.params["idea-seed"] + "/nda");
      });
    })(req, res, next);

});

/*****************************************************************
******************************************************************
******************************************************************
* Route for saving session info for an idea seed, then redirecting
* to the /ideas pathname
******************************************************************
******************************************************************
*****************************************************************/
router.get('/ideas/:ideaName', csrfProtection, function(req, res){

  if(!(req.user && req.user.username)) {
    console.log("not logged in")
    res.redirect('/');
    return;
  }

  function shuffle(a) {
      var j, x, i;
      for (i = a.length; i; i--) {
          j = Math.floor(Math.random() * i);
          x = a[i - 1];
          a[i - 1] = a[j];
          a[j] = x;
      }
  }

  shuffle(viabilities); 

  for (var via in viabilities) {
    if (!viabilities[via]['iconId']) {
      viabilities[via]['iconId'] = viabilities[via].prefix + "Icon";      
    }
    if (!viabilities[via]['sliderId']) {
      viabilities[via]['sliderId'] = viabilities[via].prefix + "Slider";
    }
    if (!viabilities[via]['labelId']) {
      viabilities[via]['labelId'] = viabilities[via].prefix + "Label";
    }
    viabilities[via]['link'] = viabilities[via].link || viabilities[via].name;
    viabilities[via]['name'] = viabilities[via].name.charAt(0).toUpperCase() + viabilities[via].name.slice(1);
  }  

  // potentially fragile logic here. all ideas should have
  // a name after the initial visit to this path. but on the first
  // visit, we'll rely on the session to grab the idea id that was
  // created on the introductory ideaseed creation pages, coming
  // from the image upload page

  if(req.params && req.params.ideaName && (req.params.ideaName != "yet-to-be-named")){
    var query = IdeaSeed.findOne({"name" : req.params.ideaName});
  } else {
    var query = IdeaSeed.findById(req.session.idea);
  }
  var headshotData, headshotURL, headshotStyle, currentIdea;
  var variantDates = [],
      sortedProblems = [];
  var imageURLs = [];
  var problems, components;
  var componentsList = [];
  var listOfProblems = [];
  var typeOfProblem, rankingOfProblem;
  var wholeSuggestionBlockInfo = {};
  var averageScore = 0;
  var filename;
  var imageStyle;
  var currentReceipt = "";
  var currentAppStrength;
  var hasActiveMembership, membershipDocument;
  var inventorAccount;
  var problemAreas = [
    "Area : Performability",
    "Area : Affordability",
    "Area : Featurability",
    "Area : Deliverability",
    "Area : Useability",
    "Area : Maintainability",
    "Area : Durability",
    "Area : Imageability",
    "Area : Complexity",
    "Area : Precision",
    "Area : Variability",
    "Area : Sensitivity",
    "Area : Immaturity",
    "Area : Danger",
    "Area : Skills"
  ];
  var ideaAptitudes;
  var openCampaign;
  let mostRecentCampaign;

  query.exec()
  .then(function(idea){
    req.session.idea = idea.id;
    currentIdea = idea._doc;

    headshotData = ideaSeedHelpers.getUserHeadshot(req);
    // headshotURL = headshotData['headshotURL'];
    headshotStyle = headshotData['headshotStyle'];

    return IdeaSeed.findById(req.session.idea).exec()
  })
  .then(function(idea){
    currentIdea = idea._doc;

    //check permissions
    if(!((currentIdea.visibility == "private" && currentIdea.inventorName == req.user.username) ||
      currentIdea.visibility == "public" ||
      (currentIdea.collaborators.indexOf(req.user.username) > -1))){
      console.log("visibility mode does not permit this user to view this idea");
      throw new Error('abort promise chain');
      return;
    }

    openCampaign = CrowdfundingService.getOpenCampaign(idea);
    mostRecentCampaign = CrowdfundingService.getNewestCampaign(idea);

    return Account.findOne({"username" : idea.inventorName});

  })
  .then(function(account){

    inventorAccount = account;

    return ideaSeedHelpers.hasActiveMembership(account);

  })
  .then(function(membership){

    hasActiveMembership = membership["hasActiveMembership"];
    if(hasActiveMembership){
      membershipDocument = membership["membership"];
      membershipDocument['formattedStartDate'] = moment(membershipDocument['startDate']).format("MMM Do YYYY");
      membershipDocument['formattedEndDate'] = moment(membershipDocument['endDate']).format("MMM Do YYYY");
    }    

    return ideaSeedHelpers.getApplicationStrength(currentIdea['_id'])
  })
  .then(function(strengthResponse){
    currentAppStrength = strengthResponse;
    return IdeaProblem.find({"ideaSeed" : currentIdea._id, date : {$exists : true}})
      .sort('-date')
      .exec()
  })
  .then(function(currentProblems){
    problems = currentProblems;
    _.each(problems, function(value, key, list){
        Account.findOne({"username": value.creator}, function(err, user) {
          value.wholeCreator = user;
          if (user.headshots[0]) {
            value.headshot = {};
            value.headshot.url = user.headshots[0].amazonURL;
            var imageStyle;
            imageStyle = ideaSeedHelpers.getImageOrientation(user.headshots[0]["orientation"]);
            value.headshot.style = imageStyle;
          }
        });
    });

    return Component.find({"ideaSeed" : currentIdea._id});
  })
  .then(function(currentComponents){
    components = currentComponents;
    var componentsNameList = _.map(components, function(eachOne) { return eachOne.creator;})

    return Account.find({"username" : {$in : componentsNameList}});
  })
  .then(function(componentCreators){
    var suggestorHeadshotIdList = _.map(componentCreators, function(eachOne) { 
      if(eachOne.headshots){
        return eachOne.headshots[0];
      } else {
        return null;
      }
    });

    components = _.filter(components, function(item){return item['text'] || item.inventorApproved;});
    var newCompOrder = [];
    _.each(components, function(oneComp, index){
      if( !oneComp.text ){
        newCompOrder.unshift(oneComp);  
      } else {
        newCompOrder.push(oneComp);
      }
    });

    components = newCompOrder;
    

    // Figure out which account and headshot go with with suggestion
    _.each(components, function(component, index){
      
      wholeSuggestionBlockInfo[component.identifier] = {'document' : component};
      
      wholeSuggestionBlockInfo[component.identifier]['ideaName'] = currentIdea.name;

      _.each(componentCreators, function(componentCreator, suggIndex){
        if(componentCreator.username == component.creator){
          //now we've found the right suggestor to go with the suggestion, so we put the 
          // nickname and suggestor profile picture into the whole block object;
          wholeSuggestionBlockInfo[component.identifier]['creatorNickname'] = componentCreator.nickname;
          if(componentCreator.headshots && componentCreator.headshots[0]){
            wholeSuggestionBlockInfo[component.identifier]['creatorProfilePic'] = componentCreator.headshots[0].amazonURL;
            var imageStyle;
            imageStyle = ideaSeedHelpers.getImageOrientation(componentCreator.headshots[0]["orientation"]);
            wholeSuggestionBlockInfo[component.identifier]['profilePicOrientation'] = imageStyle;
          }
        }
      })
    });
    componentsList = _.map(components, function(item){return "Component : "+item['text'];});
    componentsList = componentsList.filter(function(item){
      if(item == "Component : undefined"){
        return false;
      } else {
        return true;
      }
    });
    listOfProblems = IdeaSeed.getListOfInventorProblems(currentIdea) || [];
    for(var i = 0; i < listOfProblems.length; i++){
      typeOfProblem = _.invert(currentIdea)[listOfProblems[i][1]];
      rankingOfProblem = idea[typeOfProblem.slice(0, -7) + "Priority"];
      listOfProblems[i].push(rankingOfProblem);
    }
    listOfProblems = _.sortBy(listOfProblems, function(array){ return array[2];});
    if(currentIdea.variants.length > 0){
      for(var i = 0; i < currentIdea.variants.length; i++){
        variantDates.push([
          new Date(parseInt(currentIdea.variants[i].name.substr(-13))).toString(),
          currentIdea.variants[i].name
        ]);
      }
    }
    return IdeaReview.find({"reviewer" : req.user.username, "ideaSeedId" : currentIdea._id})
  })
  .then(function(review){
    if(review.length > 0){
      req.session.ideaReview = review[0];
      averageScore = Math.round(IdeaReview.averageViabilityScores(review));
    }
    return Aptitude.find({"_id" : {$in : currentIdea.aptitudes}})
  })
  .then(function(myAptitudes){
    ideaAptitudes = myAptitudes;
    return IdeaImage.findOne({"_id" : currentIdea.applicationReceipt})
  })
  .then(function(receipt){
    currentReceipt = receipt;
    return IdeaImage.find({"_id" : {$in : currentIdea.images}}).exec()
  })
  .then(function(images){
    _.each(images,function(thisImage, index){
      if(thisImage && thisImage.amazonURL){
        filename = thisImage["filename"];
        imageStyle = "";
        imageStyle = ideaSeedHelpers.getImageOrientation(thisImage["orientation"]);
        imageURLs.push([
          filename,
          thisImage["amazonURL"],
          imageStyle
        ]);
      }
    });
    res.render('pages/ideas/ideas-single', { user : req.user || {}, idea : currentIdea,
      review : req.session.ideaReview || {},
      averageScore : averageScore,
      csrfToken: req.csrfToken(),
      wholeSuggestionBlockInfo : wholeSuggestionBlockInfo,
      variantDates : variantDates,
      receipt : currentReceipt,
      strengthResponse : currentAppStrength,
      appStrengthText : currentAppStrength['appStrengthText'] || "" ,
      appStrengthClass : currentAppStrength['appStrengthClass'] || "" ,
      problemAreas  : problemAreas,
      aptitudes : ideaAptitudes,
      headshot : headshotURL,
      headshotStyle : headshotStyle,
      imageURLs : imageURLs,
      inventorName : currentIdea.inventorName,
      problems : problems,
      components : components,
      viabilities : viabilities,
      listOfProblems : listOfProblems,
      openCampaign: openCampaign,
      mostRecentCampaign: mostRecentCampaign,
      membershipDocument : membershipDocument,
      hasActiveMembership : hasActiveMembership
    });
  
  })
  .catch(function(err){
    // just need one of these
    console.log('error:', err);
    res.redirect('/');
  });

});

/*****************************************************************
******************************************************************
******************************************************************
* Route for saving session info for an idea seed, then redirecting
* to the /ideas pathname
******************************************************************
******************************************************************
*****************************************************************/
router.get('/ideas/:ideaName/redesign', csrfProtection, function(req, res){

  if(!(req.user && req.user.username)) {
    console.log("not logged in")
    res.redirect('/');
    return;
  }

  function shuffle(a) {
      var j, x, i;
      for (i = a.length; i; i--) {
          j = Math.floor(Math.random() * i);
          x = a[i - 1];
          a[i - 1] = a[j];
          a[j] = x;
      }
  }

  shuffle(viabilities);

  for (var via in viabilities) {
    if (!viabilities[via]['iconId']) {
      viabilities[via]['iconId'] = viabilities[via].prefix + "Icon";      
    }
    if (!viabilities[via]['sliderId']) {
      viabilities[via]['sliderId'] = viabilities[via].prefix + "Slider";
    }
    if (!viabilities[via]['labelId']) {
      viabilities[via]['labelId'] = viabilities[via].prefix + "Label";
    }
    viabilities[via]['link'] = viabilities[via].link || viabilities[via].name;
    viabilities[via]['name'] = viabilities[via].name.charAt(0).toUpperCase() + viabilities[via].name.slice(1);
  }  

  // potentially fragile logic here. all ideas should have
  // a name after the initial visit to this path. but on the first
  // visit, we'll rely on the session to grab the idea id that was
  // created on the introductory ideaseed creation pages, coming
  // from the image upload page

  if(req.params && req.params.ideaName && (req.params.ideaName != "yet-to-be-named")){
    var query = IdeaSeed.findOne({"name" : req.params.ideaName});
  } else {
    var query = IdeaSeed.findById(req.session.idea);
  }
  var headshotData, headshotURL, headshotStyle, currentIdea;
  var variantDates = [],
      sortedProblems = [];
  var imageURLs = [];
  var problems, components;
  var componentsList = [];
  var listOfProblems = [];
  var typeOfProblem, rankingOfProblem;
  var wholeSuggestionBlockInfo = {};
  var averageScore = 0;
  var filename;
  var imageStyle;
  var currentReceipt = "";
  var currentAppStrength;
  var problemAreas = [
    "Area : Performability",
    "Area : Affordability",
    "Area : Featurability",
    "Area : Deliverability",
    "Area : Useability",
    "Area : Maintainability",
    "Area : Durability",
    "Area : Imageability",
    "Area : Complexity",
    "Area : Precision",
    "Area : Variability",
    "Area : Sensitivity",
    "Area : Immaturity",
    "Area : Danger",
    "Area : Skills"
  ];
  var ideaAptitudes;
  var openCampaign;
  var mostRecentCampaign;

  query.exec()
  .then(function(idea){
    req.session.idea = idea.id;
    currentIdea = idea._doc;

    headshotData = ideaSeedHelpers.getUserHeadshot(req);
    // headshotURL = headshotData['headshotURL'];
    headshotStyle = headshotData['headshotStyle'];

    return IdeaSeed.findById(req.session.idea).exec()
  })
  .then(function(idea){
    currentIdea = idea._doc;

    //check permissions
    if(!((currentIdea.visibility == "private" && currentIdea.inventorName == req.user.username) ||
      currentIdea.visibility == "public" ||
      (currentIdea.collaborators.indexOf(req.user.username) > -1))){
      console.log("visibility mode does not permit this user to view this idea");
      throw new Error('abort promise chain');
      return;
    }

    openCampaign = CrowdfundingService.getOpenCampaign(idea);
    mostRecentCampaign = CrowdfundingService.getNewestCampaign(idea);

    return ideaSeedHelpers.getApplicationStrength(currentIdea['_id'])
  })
  .then(function(strengthResponse){
    currentAppStrength = strengthResponse;
    return IdeaProblem.find({"ideaSeed" : currentIdea._id, date : {$exists : true}})
      .sort('-date')
      .exec()
  })
  .then(function(currentProblems){
    problems = currentProblems;
    _.each(problems, function(value, key, list){
        Account.findOne({"username": value.creator}, function(err, user) {
          value.wholeCreator = user;
          if (user.headshots[0]) {
            value.headshot = {};
            value.headshot.url = user.headshots[0].amazonURL;
            var imageStyle;
            imageStyle = ideaSeedHelpers.getImageOrientation(user.headshots[0]["orientation"]);
            value.headshot.style = imageStyle;
          }
        });
    });

    return Component.find({"ideaSeed" : currentIdea._id});
  })
  .then(function(currentComponents){
    components = currentComponents;
    var componentsNameList = _.map(components, function(eachOne) { return eachOne.creator;})

    return Account.find({"username" : {$in : componentsNameList}});
  })
  .then(function(componentCreators){
    var suggestorHeadshotIdList = _.map(componentCreators, function(eachOne) { 
      if(eachOne.headshots){
        return eachOne.headshots[0];
      } else {
        return null;
      }
    });

    components = _.filter(components, function(item){return item['text'] || item.inventorApproved;});
    var newCompOrder = [];
    _.each(components, function(oneComp, index){
      if( !oneComp.text ){
        newCompOrder.unshift(oneComp);  
      } else {
        newCompOrder.push(oneComp);
      }
    });

    components = newCompOrder;
    components = components.slice(0,3);

    // Figure out which account and headshot go with with suggestion
    _.each(components, function(component, index){
      
      wholeSuggestionBlockInfo[component.identifier] = {'document' : component};
      
      wholeSuggestionBlockInfo[component.identifier]['ideaName'] = currentIdea.name;

      _.each(componentCreators, function(componentCreator, suggIndex){
        if(componentCreator.username == component.creator){
          //now we've found the right suggestor to go with the suggestion, so we put the 
          // nickname and suggestor profile picture into the whole block object;
          wholeSuggestionBlockInfo[component.identifier]['creatorNickname'] = componentCreator.nickname;
          if(componentCreator.headshots && componentCreator.headshots[0]){
            wholeSuggestionBlockInfo[component.identifier]['creatorProfilePic'] = componentCreator.headshots[0].amazonURL;
            var imageStyle;
            imageStyle = ideaSeedHelpers.getImageOrientation(componentCreator.headshots[0]["orientation"]);
            wholeSuggestionBlockInfo[component.identifier]['profilePicOrientation'] = imageStyle;
          }
        }
      })
    });
    componentsList = _.map(components, function(item){return "Component : "+item['text'];});
    componentsList = componentsList.filter(function(item){
      if(item == "Component : undefined"){
        return false;
      } else {
        return true;
      }
    });
    listOfProblems = IdeaSeed.getListOfInventorProblems(currentIdea) || [];
    for(var i = 0; i < listOfProblems.length; i++){
      typeOfProblem = _.invert(currentIdea)[listOfProblems[i][1]];
      rankingOfProblem = idea[typeOfProblem.slice(0, -7) + "Priority"];
      listOfProblems[i].push(rankingOfProblem);
    }
    listOfProblems = _.sortBy(listOfProblems, function(array){ return array[2];});
    if(currentIdea.variants.length > 0){
      for(var i = 0; i < currentIdea.variants.length; i++){
        variantDates.push([
          new Date(parseInt(currentIdea.variants[i].name.substr(-13))).toString(),
          currentIdea.variants[i].name
        ]);
      }
    }
    return IdeaReview.find({"reviewer" : req.user.username, "ideaSeedId" : currentIdea._id})
  })
  .then(function(review){
    if(review.length > 0){
      req.session.ideaReview = review[0];
      averageScore = Math.round(IdeaReview.averageViabilityScores(review));
    }
    return Aptitude.find({"_id" : {$in : currentIdea.aptitudes}})
  })
  .then(function(myAptitudes){
    ideaAptitudes = myAptitudes;
    return IdeaImage.findOne({"_id" : currentIdea.applicationReceipt})
  })
  .then(function(receipt){
    currentReceipt = receipt;
    return IdeaImage.findOne({"_id" : {$in : currentIdea.images}}).exec()
  })
  .then(function(images){
    _.each(images,function(thisImage, index){
      if(thisImage && thisImage.amazonURL){
        filename = thisImage["filename"];
        imageStyle = "";
        imageStyle = ideaSeedHelpers.getImageOrientation(thisImage["orientation"]);
        imageURLs.push([
          filename,
          thisImage["amazonURL"],
          imageStyle
        ]);
      }
    });
    res.render('pages/ideas/idea-single-redesign', { user : req.user || {}, idea : currentIdea,
      review : req.session.ideaReview || {},
      averageScore : averageScore,
      csrfToken: req.csrfToken(),
      wholeSuggestionBlockInfo : wholeSuggestionBlockInfo,
      variantDates : variantDates,
      receipt : currentReceipt,
      strengthResponse : currentAppStrength,
      appStrengthText : currentAppStrength['appStrengthText'] || "" ,
      appStrengthClass : currentAppStrength['appStrengthClass'] || "" ,
      problemAreas  : problemAreas,
      aptitudes : ideaAptitudes,
      headshot : headshotURL,
      headshotStyle : headshotStyle,
      imageURLs : imageURLs,
      inventorName : currentIdea.inventorName,
      problems : problems,
      components : components,
      viabilities : viabilities,
      listOfProblems : listOfProblems,
      openCampaign: openCampaign,
      mostRecentCampaign: mostRecentCampaign
    });
  
  })
  .catch(function(err){
    // just need one of these
    console.log('error:', err);
    res.redirect('/');
  });
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for saving session info for an idea seed, then redirecting
* to the /ideas pathname
******************************************************************
******************************************************************
*****************************************************************/
router.get('/ideas/:ideaName/edit', csrfProtection, function(req, res){

  if(!(req.user && req.user.username)) {
    console.log("not logged in")
    res.redirect('/');
    return;
  }

  function shuffle(a) {
      var j, x, i;
      for (i = a.length; i; i--) {
          j = Math.floor(Math.random() * i);
          x = a[i - 1];
          a[i - 1] = a[j];
          a[j] = x;
      }
  }

  shuffle(viabilities);

  for (var via in viabilities) {
    if (!viabilities[via]['iconId']) {
      viabilities[via]['iconId'] = viabilities[via].prefix + "Icon";      
    }
    if (!viabilities[via]['sliderId']) {
      viabilities[via]['sliderId'] = viabilities[via].prefix + "Slider";
    }
    if (!viabilities[via]['labelId']) {
      viabilities[via]['labelId'] = viabilities[via].prefix + "Label";
    }
    viabilities[via]['link'] = viabilities[via].link || viabilities[via].name;
    viabilities[via]['name'] = viabilities[via].name.charAt(0).toUpperCase() + viabilities[via].name.slice(1);
  }  

  // potentially fragile logic here. all ideas should have
  // a name after the initial visit to this path. but on the first
  // visit, we'll rely on the session to grab the idea id that was
  // created on the introductory ideaseed creation pages, coming
  // from the image upload page

  if(req.params && req.params.ideaName && (req.params.ideaName != "yet-to-be-named")){
    var query = IdeaSeed.findOne({"name" : req.params.ideaName});
  } else {
    var query = IdeaSeed.findById(req.session.idea);
  }
  var headshotData, headshotURL, headshotStyle, currentIdea;
  var variantDates = [],
      sortedProblems = [];
  var imageURLs = [];
  var problems, components;
  var componentsList = [];
  var listOfProblems = [];
  var typeOfProblem, rankingOfProblem;
  var wholeSuggestionBlockInfo = {};
  var averageScore = 0;
  var filename;
  var imageStyle;
  var currentReceipt = "";
  var hasActiveMembership, membershipDocument;
  var currentAppStrength;
  var problemAreas = [
    "Area : Performability",
    "Area : Affordability",
    "Area : Featurability",
    "Area : Deliverability",
    "Area : Useability",
    "Area : Maintainability",
    "Area : Durability",
    "Area : Imageability",
    "Area : Complexity",
    "Area : Precision",
    "Area : Variability",
    "Area : Sensitivity",
    "Area : Immaturity",
    "Area : Danger",
    "Area : Skills"
  ];
  var ideaAptitudes;
  var openCampaign;
  var mostRecentCampaign;

  query.exec()
  .then(function(idea){
    req.session.idea = idea.id;
    currentIdea = idea._doc;

    headshotData = ideaSeedHelpers.getUserHeadshot(req);
    // headshotURL = headshotData['headshotURL'];
    headshotStyle = headshotData['headshotStyle'];

    return IdeaSeed.findById(req.session.idea).exec()
  })
  .then(function(idea){
    currentIdea = idea._doc;

    //check permissions
    if(!((currentIdea.inventorName == req.user.username) ||
      (currentIdea.collaborators.indexOf(req.user.username) > -1))){
      console.log("visibility mode does not permit this user to view this idea");
      throw new Error('abort promise chain');
      
    }

    openCampaign = CrowdfundingService.getOpenCampaign(idea);
    mostRecentCampaign = CrowdfundingService.getNewestCampaign(idea);

    return Account.findOne({"username" : idea.inventorName});

  })
  .then(function(account){

    inventorAccount = account;

    return ideaSeedHelpers.hasActiveMembership(account);

  })
  .then(function(membership){

    hasActiveMembership = membership["hasActiveMembership"];
    if(hasActiveMembership){
      membershipDocument = membership["membership"];
      membershipDocument['formattedStartDate'] = moment(membershipDocument['startDate']).format("MMM Do YYYY");
      membershipDocument['formattedEndDate'] = moment(membershipDocument['endDate']).format("MMM Do YYYY");
    }    

    return ideaSeedHelpers.getApplicationStrength(currentIdea['_id'])
  })
  .then(function(strengthResponse){
    currentAppStrength = strengthResponse;
    return IdeaProblem.find({"ideaSeed" : currentIdea._id, date : {$exists : true}})
      .sort('-date')
      .exec()
  })
  .then(function(currentProblems){
    problems = currentProblems;
    _.each(problems, function(value, key, list){
        Account.findOne({"username": value.creator}, function(err, user) {
          value.wholeCreator = user;
          if (user.headshots[0]) {
            value.headshot = {};
            value.headshot.url = user.headshots[0].amazonURL;
            var imageStyle;
            imageStyle = ideaSeedHelpers.getImageOrientation(user.headshots[0]["orientation"]);
            value.headshot.style = imageStyle;
          }
        });
    });

    return Component.find({"ideaSeed" : currentIdea._id}).sort({date: -1}).exec();
  })
  .then(function(currentComponents){
    components = currentComponents;
    var componentsNameList = _.map(components, function(eachOne) { return eachOne.creator;})

    return Account.find({"username" : {$in : componentsNameList}});
  })
  .then(function(componentCreators){
    var suggestorHeadshotIdList = _.map(componentCreators, function(eachOne) { 
      if(eachOne.headshots){
        return eachOne.headshots[0];
      } else {
        return null;
      }
    });

    components = _.filter(components, function(item){return item['text'] || item.inventorApproved;});
    var newCompOrder = [];
    _.each(components, function(oneComp, index){
      if( !oneComp.text ){
        newCompOrder.unshift(oneComp);  
      } else {
        newCompOrder.push(oneComp);
      }
    });

    components = newCompOrder;

    // Figure out which account and headshot go with with suggestion
    _.each(components, function(component, index){
      
      wholeSuggestionBlockInfo[component.identifier] = {'document' : component};
      
      wholeSuggestionBlockInfo[component.identifier]['ideaName'] = currentIdea.name;

      _.each(componentCreators, function(componentCreator, suggIndex){
        if(componentCreator.username == component.creator){
          //now we've found the right suggestor to go with the suggestion, so we put the 
          // nickname and suggestor profile picture into the whole block object;
          wholeSuggestionBlockInfo[component.identifier]['creatorNickname'] = componentCreator.nickname;
          if(componentCreator.headshots && componentCreator.headshots[0]){
            wholeSuggestionBlockInfo[component.identifier]['creatorProfilePic'] = componentCreator.headshots[0].amazonURL;
            var imageStyle;
            imageStyle = ideaSeedHelpers.getImageOrientation(componentCreator.headshots[0]["orientation"]);
            wholeSuggestionBlockInfo[component.identifier]['profilePicOrientation'] = imageStyle;
          }
        }
      })
    });
    componentsList = _.map(components, function(item){return "Component : "+item['text'];});
    componentsList = componentsList.filter(function(item){
      if(item == "Component : undefined"){
        return false;
      } else {
        return true;
      }
    });
    listOfProblems = IdeaSeed.getListOfInventorProblems(currentIdea) || [];
    for(var i = 0; i < listOfProblems.length; i++){
      typeOfProblem = _.invert(currentIdea)[listOfProblems[i][1]];
      rankingOfProblem = idea[typeOfProblem.slice(0, -7) + "Priority"];
      listOfProblems[i].push(rankingOfProblem);
    }
    listOfProblems = _.sortBy(listOfProblems, function(array){ return array[2];});
    if(currentIdea.variants.length > 0){
      for(var i = 0; i < currentIdea.variants.length; i++){
        variantDates.push([
          new Date(parseInt(currentIdea.variants[i].name.substr(-13))).toString(),
          currentIdea.variants[i].name
        ]);
      }
    }
    return IdeaReview.find({"reviewer" : req.user.username, "ideaSeedId" : currentIdea._id})
  })
  .then(function(review){
    if(review.length > 0){
      req.session.ideaReview = review[0];
      averageScore = Math.round(IdeaReview.averageViabilityScores(review));
    }
    return Aptitude.find({"_id" : {$in : currentIdea.aptitudes}})
  })
  .then(function(myAptitudes){
    ideaAptitudes = myAptitudes;
    return IdeaImage.findOne({"_id" : currentIdea.applicationReceipt})
  })
  .then(function(receipt){
    currentReceipt = receipt;
    return IdeaImage.find({"_id" : {$in : currentIdea.images}}).exec()
  })
  .then(function(images){
    images = images.reverse(); //puts most recent images first
    _.each(images,function(thisImage, index){
      if(thisImage && thisImage.amazonURL){
        filename = thisImage["filename"];
        imageStyle = "";
        imageStyle = ideaSeedHelpers.getImageOrientation(thisImage["orientation"]);
        imageURLs.push([
          filename,
          thisImage["amazonURL"],
          imageStyle
        ]);
      }
    });
    res.render('pages/ideas/ideas-single-edit', { user : req.user || {}, idea : currentIdea,
      review : req.session.ideaReview || {},
      averageScore : averageScore,
      csrfToken: req.csrfToken(),
      wholeSuggestionBlockInfo : wholeSuggestionBlockInfo,
      variantDates : variantDates,
      receipt : currentReceipt,
      strengthResponse : currentAppStrength,
      appStrengthText : currentAppStrength['appStrengthText'] || "" ,
      appStrengthClass : currentAppStrength['appStrengthClass'] || "" ,
      problemAreas  : problemAreas,
      aptitudes : ideaAptitudes,
      headshot : headshotURL,
      headshotStyle : headshotStyle,
      imageURLs : imageURLs,
      inventorName : currentIdea.inventorName,
      problems : problems,
      membershipDocument : membershipDocument,
      hasActiveMembership : hasActiveMembership,
      components : components,
      viabilities : viabilities,
      listOfProblems : listOfProblems,
      openCampaign: openCampaign,
      mostRecentCampaign: mostRecentCampaign,
      listOfVisibleSections : currentIdea.visibleEditingSections
    });
  
  })
  .catch(function(err){
    // just need one of these
    req.session.loginPath = null;
    console.log('error:', err);
    res.redirect('/');
  });
});
/*****************************************************************
******************************************************************
******************************************************************
* Route for viewing list of all imperfections for a particular
* idea seed
******************************************************************
******************************************************************
*****************************************************************/

router.get('/ideas/:ideaName/view-all-imperfections', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)) {
    console.log("not logged in")
    res.redirect('/');
    return;
  }

  
  if(req.params && req.params.ideaName){
    var query = IdeaSeed.findOne({"name" : req.params.ideaName});
  } 

  var headshotData, headshotURL, headshotStyle, currentIdea;
  var variantDates = [],
      sortedProblems = [];
  var imageURLs = [];
  var problems, components;
  var componentsList = [];
  var listOfProblems = [];
  var typeOfProblem, rankingOfProblem;
  var averageScore = 0;
  var filename;
  var imageStyle;
  var currentReceipt = "";
  var currentAppStrength;
  var problemAreas = [
    "Area : Performability",
    "Area : Affordability",
    "Area : Featurability",
    "Area : Deliverability",
    "Area : Useability",
    "Area : Maintainability",
    "Area : Durability",
    "Area : Imageability",
    "Area : Complexity",
    "Area : Precision",
    "Area : Variability",
    "Area : Sensitivity",
    "Area : Immaturity",
    "Area : Danger",
    "Area : Skills"
  ];
  var ideaAptitudes;

  query.exec()
  .then(function(idea){
    req.session.idea = idea.id;
    currentIdea = idea._doc;

    headshotData = ideaSeedHelpers.getUserHeadshot(req);
    // headshotURL = headshotData['headshotURL'];
    headshotStyle = headshotData['headshotStyle'];

    return IdeaSeed.findById(req.session.idea).exec()
  })
  .then(function(idea){
    currentIdea = idea._doc;

    //check permissions
    if(!((currentIdea.visibility == "private" && currentIdea.inventorName == req.user.username) ||
      currentIdea.visibility == "public" ||
      (currentIdea.collaborators.indexOf(req.user.username) > -1))){
      console.log("visibility mode does not permit this user to view this idea");
      throw new Error('abort promise chain');
      return;
    }

    return IdeaProblem.find({"ideaSeed" : currentIdea._id, date : {$exists : true}})
      .sort('-date')
      .exec()
  })
  .then(function(currentProblems){
    problems = currentProblems;
    var listOfProblemCreators = [];
    _.each(problems, function(value, key, list){
      listOfProblemCreators.push(value.creator);
    });

    return Account.find({"username" : { $in : listOfProblemCreators}});
  })
  .then(function(problemCreators){
    if(problemCreators && problemCreators.length){
      //figure out which creator goes to which problem
      _.each(problemCreators, function(creator, index){
        _.each(problems, function(problem, probIndex){
          if(creator.username == problem.creator){
            problem.wholeCreator = creator;
            if (creator.headshots[0]) {
              problem.headshot = {};
              problem.headshot.url = creator.headshots[0].amazonURL;
              var imageStyle;
              imageStyle = ideaSeedHelpers.getImageOrientation(creator.headshots[0]["orientation"]);
              problem.headshot.style = imageStyle;
            }
          }  
        })
      })
    }    
    res.render('pages/ideas/idea-seed-all-imperfections', { user : req.user || {}, idea : currentIdea,
      csrfToken: req.csrfToken(),
      problemAreas  : problemAreas,
      headshot : headshotURL,
      headshotStyle : headshotStyle,
      problems : problems
    });
  
  })
  .catch(function(err){
    // just need one of these
    console.log('error:', err);
    res.redirect('/');
  });

});

/*****************************************************************
******************************************************************
******************************************************************
* Route for viewing list of all suggestions for a particular
* idea seed
******************************************************************
******************************************************************
*****************************************************************/

router.get('/ideas/:ideaName/view-all-suggestions', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)) {
    console.log("not logged in")
    res.redirect('/');
    return;
  }

  
  if(req.params && req.params.ideaName){
    var query = IdeaSeed.findOne({"name" : req.params.ideaName});
  } 

  var headshotData, headshotURL, headshotStyle, currentIdea;
  var variantDates = [],
      sortedProblems = [];
  var imageURLs = [];
  var problems, components;
  var componentsList = [];
  var listOfProblems = [];
  var typeOfProblem, rankingOfProblem;
  var averageScore = 0;
  var filename;
  var imageStyle;
  var currentReceipt = "";
  var currentAppStrength;
  var problemAreas = [
    "Area : Performability",
    "Area : Affordability",
    "Area : Featurability",
    "Area : Deliverability",
    "Area : Useability",
    "Area : Maintainability",
    "Area : Durability",
    "Area : Imageability",
    "Area : Complexity",
    "Area : Precision",
    "Area : Variability",
    "Area : Sensitivity",
    "Area : Immaturity",
    "Area : Danger",
    "Area : Skills"
  ];
  var ideaAptitudes;

  query.exec()
  .then(function(idea){
    req.session.idea = idea.id;
    currentIdea = idea._doc;

    headshotData = ideaSeedHelpers.getUserHeadshot(req);
    // headshotURL = headshotData['headshotURL'];
    headshotStyle = headshotData['headshotStyle'];

    return IdeaSeed.findById(req.session.idea).exec()
  })
  .then(function(idea){
    currentIdea = idea._doc;

    //check permissions
    if(!((currentIdea.visibility == "private" && currentIdea.inventorName == req.user.username) ||
      currentIdea.visibility == "public" ||
      (currentIdea.collaborators.indexOf(req.user.username) > -1))){
      console.log("visibility mode does not permit this user to view this idea");
      throw new Error('abort promise chain');
      return;
    }

    var suggestions = [];

    Component.find({"ideaSeed" : currentIdea['_id']}, function(err, components) {
      
      components = _.filter(components, function(component, compIndex){
        return component.problemID && component.ideaSeed;
      })

      //sort and limit components
      components = _.sortBy(components, function(oneComponent){
        return oneComponent.upvotes.length;
      }).reverse();

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
          
          wholeSuggestionBlockInfo[suggestion.identifier]['ideaName'] = currentIdea.name;

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


        res.render('pages/ideas/idea-seed-all-suggestions', { user : req.user || {}, idea : currentIdea,
          csrfToken: req.csrfToken(),
          headshot : headshotURL,
          headshotStyle : headshotStyle,
          wholeSuggestionBlockInfo : wholeSuggestionBlockInfo
        });
      });
    });
  
  })
  .catch(function(err){
    // just need one of these
    console.log('error:', err);
    res.redirect('/');
  });

});

/*****************************************************************
******************************************************************
******************************************************************
* Route for viewing list of all suggestions for a particular
* idea seed
******************************************************************
******************************************************************
*****************************************************************/

router.get('/ideas/:ideaName/view-all-components', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)) {
    console.log("not logged in")
    res.redirect('/');
    return;
  }

  
  if(req.params && req.params.ideaName){
    var query = IdeaSeed.findOne({"name" : req.params.ideaName});
  } 

  var headshotData, headshotURL, headshotStyle, currentIdea;
  var variantDates = [],
      sortedProblems = [];
  var imageURLs = [];
  var problems, components;
  var componentsList = [];
  var listOfProblems = [];
  var typeOfProblem, rankingOfProblem;
  var averageScore = 0;
  var filename;
  var wholeSuggestionBlockInfo = {};
  var imageStyle;
  var currentReceipt = "";
  var currentAppStrength;
  var problemAreas = [
    "Area : Performability",
    "Area : Affordability",
    "Area : Featurability",
    "Area : Deliverability",
    "Area : Useability",
    "Area : Maintainability",
    "Area : Durability",
    "Area : Imageability",
    "Area : Complexity",
    "Area : Precision",
    "Area : Variability",
    "Area : Sensitivity",
    "Area : Immaturity",
    "Area : Danger",
    "Area : Skills"
  ];
  var ideaAptitudes;

  query.exec()
  .then(function(idea){
    req.session.idea = idea.id;
    currentIdea = idea._doc;

    headshotData = ideaSeedHelpers.getUserHeadshot(req);
    // headshotURL = headshotData['headshotURL'];
    headshotStyle = headshotData['headshotStyle'];

    return IdeaSeed.findById(req.session.idea).exec()
  })
  .then(function(idea){
    currentIdea = idea._doc;

    //check permissions
    if(!((currentIdea.visibility == "private" && currentIdea.inventorName == req.user.username) ||
      currentIdea.visibility == "public" ||
      (currentIdea.collaborators.indexOf(req.user.username) > -1))){
      console.log("visibility mode does not permit this user to view this idea");
      throw new Error('abort promise chain');
      return;
    }

    return Component.find({"ideaSeed" : currentIdea._id});
  })
  .then(function(currentComponents){
    components = currentComponents;
    var componentsNameList = _.map(components, function(eachOne) { return eachOne.creator;})

    return Account.find({"username" : {$in : componentsNameList}});
  })
  .then(function(componentCreators){
    var suggestorHeadshotIdList = _.map(componentCreators, function(eachOne) { 
      if(eachOne.headshots){
        return eachOne.headshots[0];
      } else {
        return null;
      }
    });

    components = _.filter(components, function(item){return item['text'];});

    // Figure out which account and headshot go with with suggestion
    _.each(components, function(component, index){
      
      wholeSuggestionBlockInfo[component.identifier] = {'document' : component};
      
      wholeSuggestionBlockInfo[component.identifier]['ideaName'] = currentIdea.name;

      _.each(componentCreators, function(componentCreator, suggIndex){
        if(componentCreator.username == component.creator){
          //now we've found the right suggestor to go with the suggestion, so we put the 
          // nickname and suggestor profile picture into the whole block object;
          wholeSuggestionBlockInfo[component.identifier]['creatorNickname'] = componentCreator.nickname;
          if(componentCreator.headshots && componentCreator.headshots[0]){
            wholeSuggestionBlockInfo[component.identifier]['creatorProfilePic'] = componentCreator.headshots[0].amazonURL;
            var imageStyle;
            imageStyle = ideaSeedHelpers.getImageOrientation(componentCreator.headshots[0]["orientation"]);
            wholeSuggestionBlockInfo[component.identifier]['profilePicOrientation'] = imageStyle;
          }
        }
      })
    });
    componentsList = _.map(components, function(item){return "Component : "+item['text'];});
    componentsList = componentsList.filter(function(item){
      if(item == "Component : undefined"){
        return false;
      } else {
        return true;
      }
    });

    res.render('pages/ideas/idea-seed-all-components', { user : req.user || {}, idea : currentIdea,
      csrfToken: req.csrfToken(),
      headshot : headshotURL,
      headshotStyle : headshotStyle,
      wholeSuggestionBlockInfo : wholeSuggestionBlockInfo
    });
  
  })
  .catch(function(err){
    // just need one of these
    console.log('error:', err);
    res.redirect('/');
  });

});


/*****************************************************************
******************************************************************
******************************************************************
* Gets called when the user clicks the button to create a new
* application
******************************************************************
******************************************************************
*****************************************************************/
router.get('/create-application', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  var allImageIds = [];
  var currentAccount;
  Account.findById( req.user.id,
    function (err, account) {
      currentAccount = account._doc;
      IdeaSeed.findById(req.session.idea,function(err, idea){
        currentIdea = idea._doc;
        IdeaProblem.find({"_id" : { $in : idea.problemPriorities}}, function(err, problems){
          Component.find({"ideaSeed" : idea.id}, function(err, comps){
            _.each(comps, function(eachComponent, index){
              _.each(eachComponent.images, function(compImage){
                allImageIds.push(compImage.imageID);
              });
              if(eachComponent.mainImage){
                allImageIds.push(eachComponent.mainImage)
              }
            });

            //put all the component image ids together with the idea seed image id's and seach for
            // all of them.

            allImageIds = allImageIds.concat(idea.images);

            IdeaImage.find({"_id" : { $in : allImageIds}}, function(err, images){
              images = _.filter(images, function(item){return item.amazonURL});
  
              IdeaSeed.createApplication(currentIdea, currentAccount, problems, images, comps, res);

            });
          }); // end of image query
        });// end of problem query
      });
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Gets called when the user clicks the button to create a new
* application
******************************************************************
******************************************************************
*****************************************************************/
router.get('/membership-options', csrfProtection, function(req, res){

  res.render("pages/membership-options", {
    user : req.user || {},
    redirectURL : req.session.loginPath || "",
    csrfToken: req.csrfToken()
  });

});


/*****************************************************************
******************************************************************
******************************************************************
* Route for processing a membership payment
******************************************************************
******************************************************************
*****************************************************************/
router.post('/process-one-month-payment', csrfProtection, function(req, res){

  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  // Get the credit card details submitted by the form
  var token = req.body.stripeToken,
  hasActiveMembership = false;

  Account.findOne({"username" : req.user.username}, function(err, account){

    ideaSeedHelpers.hasActiveMembership(account).then(function(membership){

      hasActiveMembership = membership["hasActiveMembership"];
      if(hasActiveMembership){
        res.redirect('/')
        return;
      } else {
        // Create a charge: this will charge the user's card
        var charge = stripe.charges.create({
          amount: 7499, // Amount in cents
          currency: "usd",
          source: token,
          description: "Purchasing one month membership"
        }, function(err, charge) {
          if (err && err.type === 'StripeCardError') {
            // The card has been declined
          } else {

            var newMembership = new Membership({
              amountPaid : 7499,
              customerID : req.user.id,
              customerType : "account",
              startDate : moment(),
              endDate : moment().add(moment.duration({'months' : 1})),
              membershipType : "one_month"
            });

            newMembership.save(function(err, newMembershipDocument){
              if (err) {
                console.log( "error is " + err );
              } else {
                ideaSeedHelpers.createLogEntry("Began One Month Membership", "membership", req.user.id, moment(),
                  {
                    "membershipID" : newMembershipDocument.id,
                    "amountPaid" : 7499
                  }
                );
              }
            });

            res.redirect('/')
          }
        });
      }
    });
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for processing a membership payment
******************************************************************
******************************************************************
*****************************************************************/
router.post('/process-six-month-payment', csrfProtection, function(req, res){

  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  // Get the credit card details submitted by the form
  var token = req.body.stripeToken,
  hasActiveMembership = false;

  Account.findOne({"username" : req.user.username}, function(err, account){

    ideaSeedHelpers.hasActiveMembership(account).then(function(membership){

      hasActiveMembership = membership["hasActiveMembership"];
      if(hasActiveMembership){
        res.redirect('/')
        return;
      } else {
        // Create a charge: this will charge the user's card
        var charge = stripe.charges.create({
          amount: 17999, // Amount in cents
          currency: "usd",
          source: token,
          description: "Purchasing six month membership"
        }, function(err, charge) {
          if (err && err.type === 'StripeCardError') {
            // The card has been declined
          } else {

            var newMembership = new Membership({
              amountPaid : 17999,
              customerID : req.user.id,
              customerType : "account",
              startDate : moment(),
              endDate : moment().add(moment.duration({'months' : 6})),
              membershipType : "six_month"
            });

            newMembership.save(function(err, newMembershipDocument){
              if (err) {
                console.log( "error is " + err );
              } else {
                ideaSeedHelpers.createLogEntry("Began Six Month Membership", "membership", req.user.id, moment(),
                  {
                    "membershipID" : newMembershipDocument.id,
                    "amountPaid" : 17999
                  }
                );
              }
            });

            res.redirect('/')
          }
        });
      }
    });
  });
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for processing a membership payment
******************************************************************
******************************************************************
*****************************************************************/
router.post('/process-twelve-month-payment', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  // Get the credit card details submitted by the form
  var token = req.body.stripeToken,
  hasActiveMembership = false;

  Account.findOne({"username" : req.user.username}, function(err, account){

    ideaSeedHelpers.hasActiveMembership(account).then(function(membership){

      hasActiveMembership = membership["hasActiveMembership"];
      if(hasActiveMembership){
        res.redirect('/')
        return;
      } else {
        // Create a charge: this will charge the user's card
        var charge = stripe.charges.create({
          amount: 23999, // Amount in cents
          currency: "usd",
          source: token,
          description: "Purchasing twelve month membership"
        }, function(err, charge) {
          if (err && err.type === 'StripeCardError') {
            // The card has been declined
          } else {

            var newMembership = new Membership({
              amountPaid : 23999,
              customerID : req.user.id,
              customerType : "account",
              startDate : moment(),
              endDate : moment().add(moment.duration({'months' : 12})),
              membershipType : "twelve_month"
            });

            newMembership.save(function(err, newMembershipDocument){
              if (err) {
                console.log( "error is " + err );
              } else {
                ideaSeedHelpers.createLogEntry("Began Twelve Month Membership", "membership", req.user.id, moment(),
                  {
                    "membershipID" : newMembershipDocument.id,
                    "amountPaid" : 23999
                  }
                );
              }
            });

            res.redirect('/')
          }
        });
      }
    });
  });
  
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/ideas/:ideaSeedName/variant/:variantname', csrfProtection, function(req, res){

  if(!req.session.idea || !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];

    IdeaSeed.findById(req.session.idea,function(err, idea){

      var currentIdea = idea._doc;
      var currentVariant;

      Component.find({"ideaSeed" : idea.id}, function(err, components){

        for (var i = 0; i < currentIdea.variants.length; i++){
          if(currentIdea.variants[i].name == req.params.variantname){
            currentVariant = currentIdea.variants[i];
          }
        }

        if(!currentVariant){
          res.redirect('/ideas/' + currentIdea['name']);
          return;
        }

        var suggestionsList = []; //build components by category
        var imagesAndComponents = {}; //build list of components within each imageID key
        //not sure about components with no image or category yet
        var currentImageID;
        var headshotNames = [];

        for(var i = 0; i < components.length; i++){
          //break into two lists, one for components with no images, and on for those with
          if(components[i].images.length == 0 &&
            currentVariant.components.indexOf(components[i].id.toString()) > -1){
            suggestionsList.push(components[i]);
          } else {
            for(var k=0; k < components[i].images.length; k++){
              currentImageID = components[i].images[k]['imageID'].toString();
              if(currentVariant.images.indexOf(currentImageID) > -1){
                if(imagesAndComponents[components[i].images[k]['imageID'].toString()]){
                  imagesAndComponents[components[i].images[k]['imageID'].toString()].push(components[i]);
                } else {
                  imagesAndComponents[components[i].images[k]['imageID'].toString()] = [components[i]];
                }
              }
            }
          }
          if( headshotNames.indexOf(components[i]['creator']) == -1 ){
            headshotNames.push(components[i]['creator']);
          }
        }

        if(req.session.ideaReview){ var reviewing = true; }
        else { var reviewing = false; }

        IdeaImage.find({"_id" : {$in : Object.keys(imagesAndComponents)}}, function(err, images){
          var imageList = _.map(images, function(image){
            var imageStyle = "";
            imageStyle = ideaSeedHelpers.getImageOrientation(image["orientation"]);
            return [image["filename"], image["uploader"], image["id"], [], image["amazonURL"], imageStyle]
          });

            for(var i = 0; i < imageList.length; i++){
              imageList[i][3] = _.map(imagesAndComponents[imageList[i][2]], function(component){
                return [component['number'], component['text']];
              });
            }

            //get component creator and image uploader profile headshots
            Account.find({"username" : {$in : headshotNames}}, function(err, contributors){

              var headshotIDs = _.map(contributors, function(contributor){
                if(contributor.headshots && contributor.headshots[0]){
                  return contributor.headshots[0];
                } else {
                  return false;
                }
              });
              headshotIDs = _.filter(headshotIDs, function(id){return id;});

              IdeaImage.find({"_id" : {$in : headshotIDs}}, function(err, headshots){
                var headshotURLs = {};
                for(var j = 0; j < headshots.length; j++){
                  headshotURLs[headshots[j]['uploader']] = [headshots[j]["amazonURL"]];
                  var currentImageStyle = "";
                  currentImageStyle = ideaSeedHelpers.getImageOrientation(headshots[j]["orientation"]);
                  headshotURLs[headshots[j]['uploader']].push(currentImageStyle);
                }

                var allSignedOff = true;
                _.each(currentVariant.contributorsSignedOff, function(value, key){
                  if(value != "Approved"){
                    allSignedOff = false;
                  }
                });

                res.render('pages/ideas/variant', { user : req.user || {}, idea : currentIdea,
                  csrfToken: req.csrfToken(),
                  suggestionsList : suggestionsList,
                  variantName : req.params.variantname,
                  images : imageList,
                  contributors : contributors,
                  variantSummary : true,
                  listOfContributors : currentVariant.contributorsSignedOff,
                  contributorContracts : currentVariant.contributorContracts,
                  allSignedOff : allSignedOff,
                  headshotURLs : headshotURLs,
                  headshotStyle : headshotStyle,
                  headshot : headshotURL,
                  imagesAndComponents : imagesAndComponents,
                  problemType : req.session.problemType });
              });
            });
        });
      }); //end of component query
    });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/ideas/:ideaSeedName/variant/:variantname/contract/:contributorIdentifier', csrfProtection, function(req, res){

  if(!req.session.idea || !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }
  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];

  IdeaSeed.findById(req.session.idea,function(err, idea){
    var currentIdea = idea._doc;
    res.render('pages/ideas/variant-contract', { user : req.user || {},
      idea : currentIdea,
      csrfToken: req.csrfToken(),
      contributorIdentifier : req.params.contributorIdentifier,
      variantName : req.params.variantname
    });
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for a contributor signing a variant contract.
******************************************************************
******************************************************************
*****************************************************************/
router.post('/sign-variant-contract', csrfProtection, function(req, res){
  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];

    var signerName = req.body.contributorSignatureName;
    IdeaSeed.createVariantContract(signerName).then(function(contractInfo){

      IdeaSeed.find({"name" : req.body.ideaName} ,function(err, ideas){
        //update the variant list to show that people have been sent the contract.
        var idea = ideas[0];
        var currentVariant;
        for (var i = 0; i < idea.variants.length; i++){
          if(idea.variants[i].name == req.body.variantName){
            currentVariant = idea.variants[i];
          }
        }
        if(!currentVariant){
          res.redirect('/ideas/' + idea['name']);
          return;
        }

        //find the contributor who this email is being sent to and record that their response is pending
        currentVariant['contributorsSignedOff'][req.body.contributorIdentifier] = "Approved";
        if (contractInfo['filename'] && contractInfo['location'] && currentVariant['contributorContracts']){
          currentVariant['contributorContracts'][req.body.contributorIdentifier] = {
            filename : contractInfo['filename'],
            location : contractInfo['location']
          };
        }
        currentVariant.markModified('contributorsSignedOff');
        currentVariant.markModified('contributorContracts');
        idea.save(function(err){
          if(err) { console.log(err); }
          res.sendStatus(200);
          return;
        });

      });
    }); // end of promis from contract creation
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/annotate-image/:image', csrfProtection, function(req, res){
  if(!req.session.idea || !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }
  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];


  IdeaSeed.findById(req.session.idea, function(err, idea){
    IdeaImage.findOne({"filename": req.params.image} ,function(err, image){
      currentImage = image._doc;
      var annotations = [];
      var imageTitle = image.title || "";
      if(currentImage.amazonURL){
        imageURL = currentImage.amazonURL;
        var imageStyle = "";
        imageStyle = ideaSeedHelpers.getImageOrientation(currentImage["orientation"]);
        Component.find({"images.imageID" : image.id}, function(err, comps){
          var compArray = [], masterComponentList = [];
          for(var i = 0; i < comps.length; i++){
            for(var k = 0; k < comps[i].images.length; k++){
              if(comps[i].images[k].imageID.toString() == image.id) {
                compArray[i] = {
                  "text" : comps[i].text,
                  "number"  : comps[i].number,
                  "identifier"  : comps[i].images[k].identifier,
                  "firstX"  : comps[i].images[k].firstX,
                  "firstY"  : comps[i].images[k].firstY,
                  "secondX" : comps[i].images[k].secondX,
                  "secondY" : comps[i].images[k].secondY
                };
              }
            }
          }

          var nextNumber = 1;
            Component.find({ }, function(err, comps){
              for(var j = 0; j < comps.length; j++){
                if ( comps[j]['ideaSeed'] && comps[j]['ideaSeed'][0].id.toString() ==  req.session.idea ) {
                  masterComponentList.push(comps[j]);
                  nextNumber++;
                }
              }

              compArray = _.sortBy(compArray, 'number');
              masterComponentList = _.sortBy(masterComponentList, 'number');
              res.render('pages/ideas/annotate-image', {
                csrfToken: req.csrfToken(),
                user : req.user || {},
                imgURL : imageURL,
                idea : idea,
                imageStyle : imageStyle,
                imageTitle : imageTitle,
                headshot : headshotURL,
                headshotStyle : headshotStyle,
                imageName : currentImage.filename,
                annotations : JSON.stringify(annotations),
                masterComponentList : masterComponentList,
                masterComponentsString : JSON.stringify(masterComponentList).replace(/\\n/g, "\\n")
                                        .replace(/'/g, "\\'")
                                        .replace(/"/g, '\\"')
                                        .replace(/\\&/g, "\\&")
                                        .replace(/\\r/g, "\\r")
                                        .replace(/\\t/g, "\\t")
                                        .replace(/\\b/g, "\\b")
                                        .replace(/\\f/g, "\\f"),
                comps : compArray,
                compsString : JSON.stringify(compArray),
                nextNumber : nextNumber
              });
          });

        });
      } else {
        res.redirect('/');
      }
    });
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for image modal
******************************************************************
******************************************************************
*****************************************************************/
router.get('/get-last-component-description', csrfProtection, function(req, res){
  if(!req.session.idea || !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }
  Component.findOne({"text" : req.query.component}, function(err, component){
    if(err || !component){
      res.sendStatus(404);
      return;
    }
    if(component.descriptions.length > 0){
      res.json({
        "description" : component.descriptions[component.descriptions.length - 1],
        "title"       : component.text,
        "identifier"  : component.identifier
      });
    } else {
      res.json({
        "title"       : component.text,
        "identifier"  : component.identifier
      });
    }
  });
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for image modal
******************************************************************
******************************************************************
*****************************************************************/
router.get('/image-modal/:image', csrfProtection, function(req, res){
  if(!req.session.idea || !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }
  IdeaImage.findOne({"filename": req.params.image} ,function(err, image){
    currentImage = image._doc;
    if(currentImage["amazonURL"]){
      imageURL = currentImage["amazonURL"];
      var imageStyle = "";
      imageStyle = ideaSeedHelpers.getImageOrientation(currentImage["orientation"]);

      res.json({
        imgURL : imageURL, imageStyle : imageStyle
      });

    } else {
      res.json({});
    }
  });
});



/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.post('/save-component', csrfProtection, function(req, res) {
  if(!req.session.idea || !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }
  IdeaImage.findOne({"filename" : req.body.imageName}, function(err, image){

    if(err){
      res.json({error: err});
    }

    req.body.component = req.body.component.slice("The component named the ".length); //get rid of "the solution of "

    if(req.body.component.indexOf("the") == 0 || req.body.component.indexOf("The") == 0){
      req.body.component = req.body.component.slice(4);      
    }

    if(req.body.component.charAt(req.body.component.length-1) == "."){
      req.body.component = req.body.component.slice(-1);
    }

    Component.findOne({$and : [{ "ideaSeed" : req.session.idea },
      {"text" : req.body.component}]},
      function(err, component){
      if(err){
        res.json({error: err});
      }

      if(component){
        component.images.push(
          {
            imageID   : image.id,
            firstX    : req.body.firstX,
            firstY    : req.body.firstY,
            secondX   : req.body.secondX,
            secondY   : req.body.secondY
          }
        );
        component.save(function(err){
          if (err) return handleError(err);
          Account.findById( req.user.id,
            function (err, account) {
              account.einsteinPoints = account.einsteinPoints + 10;
              today = ideaSeedHelpers.getCurrentDate();
              if(account.einsteinHistory){
                account.einsteinHistory.push("You earned 10 Einstein Points on " + today + " by saving a component for your idea.");
              } else {
                account.einsteinHistory = ["You earned 10 Einstein Points on " + today + " by saving a component for your idea."];
              }
              account.save(function (err) {});
          });
        });
        res.sendStatus(200);
      } else {
        var newComp = new Component({
          text : req.body.component,
          number : req.body.number,
          images : [{
            imageID   : image.id,
            firstX    : req.body.firstX,
            firstY    : req.body.firstY,
            secondX   : req.body.secondX,
            secondY   : req.body.secondY
          }],

          ideaSeed    : req.session.idea,
          identifier  : "comp-"+Date.now() + Math.floor((Math.random() * 10) + 1)
        });
        newComp.save(function(err){
          if (err) return handleError(err);
          Account.findById( req.user.id,
            function (err, account) {
              account.einsteinPoints = account.einsteinPoints + 10;
              today = ideaSeedHelpers.getCurrentDate();
              if(account.einsteinHistory){
                account.einsteinHistory.push("You earned 10 Einstein Points on " + today + " by saving a component for your idea.");
              } else {
                account.einsteinHistory = ["You earned 10 Einstein Points on " + today + " by saving a component for your idea."];
              }
              account.save(function (err) {});
          });
        });
        res.sendStatus(200);
      }
    });
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for editing an existing component
******************************************************************
******************************************************************
*****************************************************************/
router.post('/edit-component', csrfProtection, function(req, res) {
  if(!req.session.idea || !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }
    Component.findOne({"text" : req.body.previousTitle}, function(err, component){
      if(err){
        res.json({error: err});
      }

      if(component){
        component.text = req.body.newTitle.slice(16);

        if(req.body.component.indexOf("the") == 0 || req.body.component.indexOf("The") == 0){
          req.body.component = req.body.component.slice(4);      
        }

        if(component.text.charAt(component.text.length-1) == "."){
          component.text = component.text.slice(-1);
        }

        req.body.newTitle = component.text;
        component.save(function(err){
          res.json(req.body);
        });
      } else { // no existing component found with previous title
        res.sendStatus(200);
      }
    });
});





/*****************************************************************
******************************************************************
******************************************************************
* Route for deleting image components.
* Note : this only removes a component from a particular image, not
* entirely from the database.

******************************************************************
******************************************************************
*****************************************************************/
router.post('/delete-image-component', csrfProtection, function(req, res) {
  if(!req.session.idea || !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }
  IdeaImage.findOne({"filename" : req.body.imageName}, function(err, image){
    var imageID = image.id;
    Component.findOne({"text" : req.body.componentName}, function(err, component){
      for(var i = 0; i < component.images.length; i++){
        if(component.images[i].imageID.toString() == imageID.toString()){
          component.images.splice(i,1);
          component.save();
          res.json({
            deletedComponent : req.body.componentName,
            deletedCompNumber : component.number
          });
        }
      }
    });
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/logout', csrfProtection, function(req, res) {
  req.session.idea = null;
  req.logout();
  res.redirect('/');
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/clear-session-idea', csrfProtection, function(req, res){
  if(req.session.idea){
    req.session.idea = null;
    req.session.save();
  } 
  res.sendStatus(200)
});
/*****************************************************************
******************************************************************
******************************************************************
* Route for begin contributor review
******************************************************************
******************************************************************
*****************************************************************/
router.get('/begin-contributor-review', csrfProtection, function(req, res){
  if(!req.session.idea || !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }
  if(req.session.idea){
    var ideaReview = new IdeaReview({
      reviewer : req.user.username,
      ideaSeedId : req.session.idea
    });
    ideaReview.save(function(err, newReview){
      if (err) {
        console.log(err);
      } else {
        IdeaSeed.findOneAndUpdate(
            { _id : req.session.idea },
            { $push : { ideaReviews : newReview.id } },
            function(err, idea){
              console.log('The raw response from Mongo was ', idea);
              req.session.ideaReview = newReview.id;
              res.sendStatus(200);
            }
        );
      }
    });
  }
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for viewing all accounts
******************************************************************
******************************************************************
*****************************************************************/
router.get('/imagineers', csrfProtection, function(req, res){

  var topInventors,
      totalReviewList = [];

  Account.find({}).sort({'einsteinPoints' : -1}).exec()
  .then(function(accounts){

    topInventors = accounts;

    res.render('pages/imagineers/imagineers', {
      user : req.user || {},
      topInventors : topInventors
    });

  })
  .catch(function(err){
    // just need one of these
    console.log('error:', err);
    res.redirect('/');
  });
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for imperfection profile
******************************************************************
******************************************************************
*****************************************************************/
router.get('/leaderboard', csrfProtection, function(req, res){

  var topInventors,
      totalReviewList = [];
  var allNetworks = [];
  var schools = [];
  var locations = [];
  var companies = [];
  var otherGroups = [];
  var numberOfMembers = {};
  var jamLeaders = {};

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
      jamLeaders[oneNetwork.name] = [];
      _.each(accounts, function(account, accIndex){
        if(account.networks['school'] == oneNetwork.id ||
          account.networks['company'] == oneNetwork.id ||
          account.networks['location'] == oneNetwork.id ||
          account.otherNetworks.indexOf(oneNetwork.id) >= 0){

          numberOfMembers[oneNetwork.name]++;

          jamLeaders[oneNetwork.name].push(account);
        }
      });

      //sort the jam leaders by einstein points
      jamLeaders[oneNetwork.name] = _.sortBy(jamLeaders[oneNetwork.name], function(account){
        return account.einsteinPoints * -1;
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
    return Account.find({}).limit(6).sort({'einsteinPoints' : -1}).exec()
  })
  .then(function(accounts){

    topInventors = accounts;

    return Network.find({}).exec();
  })
  .then(function(networks){


    return IdeaSeed.find({$and: [{"name": {$ne: null}}, {"visibility" : "public"}]}).exec();
  })
  .then(function(ideas){

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


      _.each(ideas, function(ideaKey, index){
        if(Object.keys(reviewScores).indexOf(ideas[index]) == -1){
          reviewScores[ideas[index]] = 0;
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


          res.render('pages/leaderboard', {
            user : req.user || {},
            // jams : allNetworks,
            topInventors : topInventors,
            ideas : ideaList,
            jams : allNetworks,
            schools : schools,
            locations : locations,
            companies : companies,
            otherGroups : otherGroups,
            numberOfMembers : numberOfMembers,
            jamLeaders : jamLeaders            
          });
        });
      });
    });

  })
  .catch(function(err){
    // just need one of these
    console.log('error:', err);
    res.redirect('/');
  });

});


/*****************************************************************
******************************************************************
******************************************************************
* Route for imperfection profile
******************************************************************
******************************************************************
*****************************************************************/
router.get('/imperfection-profile/:identifier', csrfProtection, function(req, res){
  var masterSchoolNetworkList = [],
      schoolNetwork = "",
      masterCompanyNetworkList = [],
      companyNetwork = "",
      masterLocationNetworkList = [],
      locationNetwork = "";

  //coming from jam page
  if (!req.session.idea && req.params.identifier) {
    IdeaProblem.findOne({
      "identifier" : req.params.identifier
      }, function(err, ideaProblem){
        IdeaSeed.findById(ideaProblem.ideaSeed[0].id, function(err, idea){
          req.session.idea = idea.id;
          if(!req.session.idea || !(req.user && req.user.username)){
            res.redirect('/');
            return;
          }
        });
      });
  }

  IdeaSeed.findById(req.session.idea,function(err, idea){
    IdeaProblem.findOne({
      "identifier" : req.params.identifier
      }, function(err, ideaProblem){

      if(!ideaProblem){
        res.redirect('/');
        return;
      }
      Account.findOne({"username" : ideaProblem.creator}, function(err, problemCreator){
        if(!problemCreator){
          res.redirect('/');
          return;
        }

        Network.find({}, function(err, networks){

          _.each(networks, function(element, index, list){
            if(element['type'] == 'school'){
              masterSchoolNetworkList.push(element);
              //get school name if it exists
              if(problemCreator.networks
                && problemCreator.networks['school']
                && problemCreator.networks['school'].toString() == element['id'].toString()){
                  schoolNetwork = element['name'];
              }
            }

            if(element['type'] == 'company'){
              masterCompanyNetworkList.push(element);
              //get company name if it exists
              if(problemCreator.networks
                && problemCreator.networks['company']
                && problemCreator.networks['company'].toString() == element['id'].toString()){
                  companyNetwork = element['name'];
              }
            }

            if(element['type'] == 'location'){
              masterLocationNetworkList.push(element);
              //get company name if it exists
              if(problemCreator.networks
                && problemCreator.networks['location']
                && problemCreator.networks['location'].toString() == element['id'].toString()){
                  locationNetwork = element['name'];
              }
            }
          }); 
        });

        Component.find({
          "problemID" : ideaProblem.id
          }, function(err, suggestions){

            //get all the suggestions for the problem and get their points
            components = suggestions;
            var categorizedSuggestions = {};
            for(var i = 0; i < components.length; i++){
              if(components[i].category && categorizedSuggestions[components[i].category]){
                categorizedSuggestions[components[i].category].push(components[i]);
              } else if (components[i].category && !categorizedSuggestions[components[i].category]){
                categorizedSuggestions[components[i].category] = [components[i]];
              }
            }
            var categoryPointValues = Component.getCategoryPointValues(categorizedSuggestions);

            var targetPoints = [
              ["Functions", "Functions"],
              ["Parts", "Parts"],
              ["Life-Cycle Processes", "Life-Cycle-Processes"],
              ["Materials", "Materials"],
              ["People", "People"]
            ];

            var tacticPoints = _.map(tacticConstants, function(oneTactic, tacticIndex){
              switch (oneTactic) {
                case "Eliminate" : 
                  return [oneTactic,
                    Math.max(categoryPointValues["elim-func"],
                      categoryPointValues["elim-parts"],
                      categoryPointValues["elim-life"],
                      categoryPointValues["elim-mat"],
                      categoryPointValues["elim-people"]
                    )];
                  break;
                case "Reduce" :
                  return [oneTactic,
                    Math.max(categoryPointValues["reduce-func"],
                      categoryPointValues["reduce-parts"],
                      categoryPointValues["reduce-life"],
                      categoryPointValues["reduce-mat"],
                      categoryPointValues["reduce-people"]
                    )];
                  break;
                case "Substitute" :
                  return [oneTactic,
                    Math.max(categoryPointValues["sub-func"],
                      categoryPointValues["sub-parts"],
                      categoryPointValues["sub-life"],
                      categoryPointValues["sub-mat"],
                      categoryPointValues["sub-people"]
                    )];
                  break;
                case "Separate" :
                  return [oneTactic,
                    Math.max(categoryPointValues["sep-func"],
                      categoryPointValues["sep-parts"],
                      categoryPointValues["sep-life"],
                      categoryPointValues["sep-mat"],
                      categoryPointValues["sep-people"]
                    )];
                  break;
                case "Integrate" :
                  return [oneTactic,
                    Math.max(categoryPointValues["int-func"],
                      categoryPointValues["int-parts"],
                      categoryPointValues["int-life"],
                      categoryPointValues["int-mat"],
                      categoryPointValues["int-people"]
                    )];
                  break;
                case "Re-Use" :
                  return [oneTactic,
                    Math.max(categoryPointValues["reuse-func"],
                      categoryPointValues["reuse-parts"],
                      categoryPointValues["reuse-life"],
                      categoryPointValues["reuse-mat"],
                      categoryPointValues["reuse-people"]
                    )];
                  break;
                case "Standardize" :
                  return [oneTactic,
                    Math.max(categoryPointValues["stand-func"],
                      categoryPointValues["stand-parts"],
                      categoryPointValues["stand-life"],
                      categoryPointValues["stand-mat"],
                      categoryPointValues["stand-people"]
                    )];
                  break;
                case "Add" :
                  return [oneTactic,
                    Math.max(categoryPointValues["add-func"],
                      categoryPointValues["add-parts"],
                      categoryPointValues["add-life"],
                      categoryPointValues["add-mat"],
                      categoryPointValues["add-people"]
                    )];
                  break;
              }
              
            })

            if(req.session.ideaReview){ var reviewing = true; }
            else { var reviewing = false; }

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

                res.render('pages/ideas/imperfection-profile', {
                  csrfToken: req.csrfToken(),
                  problem : ideaProblem,
                  wholeSuggestionBlockInfo : wholeSuggestionBlockInfo,
                  idea : idea || {},
                  problemCreator : problemCreator,
                  user : req.user || {},
                  suggestions: suggestions,
                  categoryPoints : categoryPointValues,
                  targetPoints : targetPoints,
                  targets: targetConstants,
                  tactics: tacticPoints,
                  schoolNetwork : schoolNetwork,
                  locationNetwork : locationNetwork,
                  companyNetwork : companyNetwork                  
                });
              }); //end of idea image query
            }); // end of account query
          }).sort({date: -1});
      })
    });
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for populate test
******************************************************************
******************************************************************
*****************************************************************/
router.get('/populate-test/', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  Account.findOne({ 'username' : req.user.username  }, function(err, doc){
      res.render('pages/populate-test', {
        user : req.user || {},
        aptitudes: doc.aptitudes,
        ideaSeeds: doc.ideaSeeds
      });      
    });
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for getting an NDA between inventor and collaborator
******************************************************************
******************************************************************
*****************************************************************/
router.get('/ideas/:ideaName/nda', csrfProtection, function(req, res){
  var userAccount;
  if(req.user && req.user.username){
    Account.findOne({ 'username' : req.user.username  }).exec()
    .then(function(account){
      userAccount = account;
      return IdeaSeed.find({"name" : req.params.ideaName}).exec()
    })
    .then(function(ideas){
      if(ideas && ideas.length){
        res.render('pages/nda', {
          user : userAccount,
          csrfToken: req.csrfToken(),
          idea : ideas[0] || {}
        });
      } else {
        throw new Error('abort promise chain');
      }
    })
    .catch(function(err){
      console.log("error is " + err)
      res.redirect('/')
      return;
    })
  } else {
    IdeaSeed.find({"name" : req.params.ideaName}).exec()
    .then(function(ideas){
      if(ideas && ideas.length){
        req.session.loginPath = "/ideas/" + ideas[0].name + "/nda"
        res.render('pages/nda', {
          user : userAccount || {},
          csrfToken: req.csrfToken(),
          idea : ideas[0] || {}
        });
      } else {
        throw new Error('abort promise chain');
      }
    })
    .catch(function(err){
      console.log("error is " + err)
      res.redirect('/')
      return;
    });
  }
});

router.post('/sign-nda', csrfProtection, function(req, res){
  if(req.body.agree && req.user && req.user.id){
    var collaboratorAccount;
    Account.findById(req.user.id).exec()
    .then(function(account){
      if(account){
        collaboratorAccount = account;
        return IdeaSeed.find({"name" : req.body["idea-seed"]}).exec()
      } else {
        throw new Error('abort promise chain');
      }
    })
    .then(function(ideaSeeds){
      if(ideaSeeds && ideaSeeds[0]){
        var thisIdea = ideaSeeds[0];
        if(thisIdea.collaborators && thisIdea.collaborators.length && thisIdea.collaborators.indexOf(collaboratorAccount.username) == -1 ){
          thisIdea.collaborators.push(collaboratorAccount.username);
        } else {
          thisIdea['collaborators'] = [collaboratorAccount.username];
        }

        thisIdea.save(function (err, idea) {
          if (err) return console.error(err);
        });
        req.session.loginPath = null;
        res.redirect('/ideas/' + req.body["idea-seed"]);
        return;
      } else {
        throw new Error('abort promise chain here');
      }
    })
    .catch(function(err){
      console.log("this error is " + err)
      res.redirect('/')
      return;
    });    
  } else {
    console.log("that error is " + err)
    res.redirect('/')
    return;
  }
})


/*****************************************************************
******************************************************************
******************************************************************
* Route for component profile
******************************************************************
******************************************************************
*****************************************************************/
router.post('/add-idea-editing-section', csrfProtection, function(req, res){

  if(!(req.user && req.user.username && req.body.ideaName && req.body.newEditingSection)){
    res.redirect('/');
    return;
  }

  IdeaSeed.findOne({"name" : req.body.ideaName}).exec()
  .then(function(ideaSeed){
    if(ideaSeed.visibleEditingSections.indexOf(req.body.newEditingSection) == -1){
      if ( ideaSeed.visibleEditingSections && ideaSeed.visibleEditingSections.length ) {
        ideaSeed.visibleEditingSections.push(req.body.newEditingSection)
      } else {
        ideaSeed.visibleEditingSections = [req.body.newEditingSection];
      }

      ideaSeed.save()
    }
    res.json({"status" : "complete"});
  })

});


/*****************************************************************
******************************************************************
******************************************************************
* Route for component profile
******************************************************************
******************************************************************
*****************************************************************/
router.get('/component-profile/:identifier', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)){
    res.redirect('/');
    return;
  }
  var parentComponents = [];
  var relatedCompArray;

  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];

    Component.findOne({"identifier" : req.params.identifier}, function(err, component){
      if(!component || !component.ideaSeed){
        res.redirect('/');
        return;
      } 
      var ideaSeedId = req.session.idea || component.ideaSeed.toString();
      IdeaSeed.findById(ideaSeedId,function(err, idea){

        Component.find({
          "ideaSeed" : req.session.idea
          }, function(err, components){

          var relatedComponents = [];
          if(component.relatedComps.length > 0){
            var compDescription = "";
            var relatedCompIdStrings = _.map(component.relatedComps, function(item){
              return item['compID'].toString();
            });

            for(var j = 0; j < components.length; j++){
              //gets the component object for each id in the list of related comp ID's
              for(var i = 0; i < relatedCompIdStrings.length; i++){
                if(relatedCompIdStrings[i] == components[j]['id']){
                  compDescription = component.relatedComps[i]['relationship'];
                  relatedCompArray = [components[j], compDescription];
                  if(component.relatedComps[i]['subComponent'] && component.relatedComps[i]['subComponent'] == "parent"){
                    var mainCompTitle = component.text ||component.descriptions[0] || "No component title";
                    var otherCompTitle = components[j].text ||components[j].descriptions[0] || "No component title";
                    relatedCompArray.push("The " + otherCompTitle + " is a sub-component of the " + mainCompTitle + ".");
                  } else if (component.relatedComps[i]['subComponent'] && component.relatedComps[i]['subComponent'] == "sub-component"){
                    var mainCompTitle = component.text ||component.descriptions[0] || "No component title";
                    var otherCompTitle = components[j].text ||components[j].descriptions[0] || "No component title";
                    relatedCompArray.push("The " + mainCompTitle + " is a sub-component of the " + otherCompTitle + ".");
                  }
                  relatedComponents.push(relatedCompArray);

                  //check if this component is a sub-component of another, and list other
                  //components that it's a sub-component of by the title
                  var thisComponentTitle = component.text || component.descriptions[0] || "No title";
                  if(component.relatedComps[i]['subComponent'] && component.relatedComps[i]['subComponent'] == "sub-component"){
                    parentComponents.push(components[j])
                  }
                }
              }
            }
          }

          var listOfVariants = [], variantDates = [];
          if(idea.variants.length > 0){
            for(var k = 0; k < idea.variants.length; k ++){
              if(idea.variants[k].components && idea.variants[k].components.indexOf(component['id'].toString()) > -1){
                listOfVariants.push(idea.variants[k]);
              }
            }
          }

          variantDates = _.map(listOfVariants, function(item){
            return [new Date(parseInt(item.name.substr(-13))).toString(), item.name];
          });

          Account.findOne({"username" : idea.inventorName}, function(err, ideaInventor){
            Account.findOne({"username" : component.creator}, function(err, componentContributor){
              if(component['problemID']){
                IdeaProblem.findOne({"_id" : component['problemID']}, function(err, problem){

                  //Get problem creator picture
                  Account.findOne({"username": problem['creator']}, function(err, problemCreator){

                    //assumes the first headshot in the user's array of headshots is their
                    // primary one for display
                    if(problemCreator['headshots']){
                      var problemHeadshotID = problemCreator['headshots'][0];
                      var problemHeadshotURL = '';
                    } else {
                      var problemHeadshotID, problemHeadshotURL, problemHeadshotStyle;
                    }

                    problem['wholeCreator'] = {
                      'nickname' : problemCreator['nickname']
                    };

                    //first get the images that the component is in
                    if(component.images.length > 0 || problemHeadshotID){
                      var imageIDs = _.map(component.images, function(item){ return item['imageID']});

                      if(problemHeadshotID){
                        imageIDs.push(problemHeadshotID);
                      }

                      IdeaImage.find({"_id" : {$in : imageIDs}}, function(err, images){
                        var imageURLs = [];
                        for(var i = 0; i < images.length; i++){
                          if(images[i] && images[i]['amazonURL']){
                            var imageStyle = "";
                            imageStyle = ideaSeedHelpers.getImageOrientation(images[i]["orientation"]);
                            var filename = images[i]["filename"];
                            //if it's the main component image, put in the first spot of the array so it's big on
                            // the component profile page
                            if(component.mainImage && images[i].id.toString() == component.mainImage.toString()){
                              imageURLs.unshift([
                                filename,
                                images[i]["amazonURL"],
                                imageStyle
                              ]);
                            } else if( images[i].id.toString() == problemCreator['headshots'][0]){
                              problemHeadshotURL = images[i]["amazonURL"];
                              problemHeadshotStyle = imageStyle;
                            } else {
                              imageURLs.push([
                                filename,
                                images[i]["amazonURL"],
                                imageStyle
                              ]);
                            }
                          }
                        }
                        problem['headshot'] = {
                          'url' : problemHeadshotURL,
                          'style' : problemHeadshotStyle
                        };

                        res.render('pages/ideas/component-profile', {
                          csrfToken: req.csrfToken(),
                          user : req.user || {},
                          headshot : headshotURL,
                          headshotStyle : headshotStyle,
                          idea : idea._doc,
                          ideaInventor : ideaInventor,
                          componentContributor : componentContributor,
                          problemHeadshotURL : problemHeadshotURL,
                          component : component,
                          problem : problem,
                          parentComponents : parentComponents,
                          variantDates : variantDates,
                          imageURLs : imageURLs,
                          components : components,
                          relatedComponents : relatedComponents
                        });
                      });//end of image query

                    // in case theres no images
                    } else {
                          res.render('pages/ideas/component-profile', {
                            csrfToken: req.csrfToken(),
                            user : req.user || {},
                            headshot : headshotURL,
                            headshotStyle : headshotStyle,
                            problemHeadshotURL : problemHeadshotURL,
                            idea : idea._doc,
                            ideaInventor : ideaInventor,
                            componentContributor : componentContributor,
                            components : components,
                            parentComponents : parentComponents,
                            component : component,
                            problem : problem,
                            variantDates : variantDates,
                            //problemAreas  : problemAreas,
                            imageURLs : [],
                            relatedComponents : relatedComponents
                            //components : components,
                            //listOfProblems : listOfProblems
                          });
                    }
                  }); // end of problem creator query
                });// end of problem query
              } else {
                  //first get the images that the component is in
                  if(component.images.length > 0 || component.mainImage){
                    var imageIDs = _.map(component.images || [], function(item){ return item['imageID']});


                    IdeaImage.find({"_id" : {$in : imageIDs}}, function(err, images){
                      var imageURLs = [];
                      for(var i = 0; i < images.length; i++){
                        var imageStyle = "";
                        imageStyle = ideaSeedHelpers.getImageOrientation(images[i]["orientation"]);
                        if(images[i] && images[i]["amazonURL"]){
                          var filename = images[i]["filename"];
                          //if it's the main component image, put in the first spot of the array so it's big on
                          // the component profile page
                          if(component.mainImage && images[i].id.toString() == component.mainImage.toString()){
                            imageURLs.unshift([
                              filename,
                              images[i]["amazonURL"],
                              imageStyle
                            ]);
                          } else {
                            imageURLs.push([
                              filename,
                              images[i]["amazonURL"],
                              imageStyle
                            ]);
                          }
                        }
                      }
                      res.render('pages/ideas/component-profile', {
                        csrfToken: req.csrfToken(),
                        user : req.user || {},
                        headshot : headshotURL,
                        headshotStyle : headshotStyle,
                        idea : idea._doc,
                        ideaInventor : ideaInventor,
                        parentComponents : parentComponents,
                        componentContributor : componentContributor,
                        components : components,
                        component : component,
                        problem : "none",
                        variantDates : variantDates,
                        imageURLs : imageURLs,
                        relatedComponents : relatedComponents
                        //components : components,
                        //listOfProblems : listOfProblems
                      });

                    });//end of image query

                  // in case theres no images
                  } else {
                        res.render('pages/ideas/component-profile', {
                          csrfToken: req.csrfToken(),
                          user : req.user || {},
                          headshot : headshotURL,
                          headshotStyle : headshotStyle,
                          idea : idea._doc,
                          ideaInventor : ideaInventor,
                          components : components,
                          componentContributor : componentContributor,
                          parentComponents : parentComponents,
                          component : component,
                          variantDates : variantDates,
                          problem : "none",
                          relatedComponents : relatedComponents,
                          imageURLs : []
                        });
                  }
              }
          }); //end of component contributor
          }); //end of idea inventor query
        }); // end of other component query
      });

    });// end of component query
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for component profile
******************************************************************
******************************************************************
*****************************************************************/
router.get('/component-profile/:identifier/edit', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)){
    res.redirect('/');
    return;
  }
  var parentComponents = [];
  var relatedCompArray;

  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];

    Component.findOne({"identifier" : req.params.identifier}, function(err, component){
      if(!component || !component.ideaSeed){
        res.redirect('/');
        return;
      } 
      var ideaSeedId = req.session.idea || component.ideaSeed.toString();
      IdeaSeed.findById(ideaSeedId,function(err, idea){

        Component.find({
          "ideaSeed" : req.session.idea
          }, function(err, components){

          var relatedComponents = [];
          if(component.relatedComps.length > 0){
            var compDescription = "";
            var relatedCompIdStrings = _.map(component.relatedComps, function(item){
              return item['compID'].toString();
            });

            for(var j = 0; j < components.length; j++){
              //gets the component object for each id in the list of related comp ID's
              for(var i = 0; i < relatedCompIdStrings.length; i++){
                if(relatedCompIdStrings[i] == components[j]['id']){
                  compDescription = component.relatedComps[i]['relationship'];
                  relatedCompArray = [components[j], compDescription];
                  if(component.relatedComps[i]['subComponent'] && component.relatedComps[i]['subComponent'] == "parent"){
                    var mainCompTitle = component.text ||component.descriptions[0] || "No component title";
                    var otherCompTitle = components[j].text ||components[j].descriptions[0] || "No component title";
                    relatedCompArray.push("The " + otherCompTitle + " is a sub-component of the " + mainCompTitle + ".");
                  } else if (component.relatedComps[i]['subComponent'] && component.relatedComps[i]['subComponent'] == "sub-component"){
                    var mainCompTitle = component.text ||component.descriptions[0] || "No component title";
                    var otherCompTitle = components[j].text ||components[j].descriptions[0] || "No component title";
                    relatedCompArray.push("The " + mainCompTitle + " is a sub-component of the " + otherCompTitle + ".");
                  }
                  relatedComponents.push(relatedCompArray);

                  //check if this component is a sub-component of another, and list other
                  //components that it's a sub-component of by the title
                  var thisComponentTitle = component.text || component.descriptions[0] || "No title";
                  if(component.relatedComps[i]['subComponent'] && component.relatedComps[i]['subComponent'] == "sub-component"){
                    parentComponents.push(components[j])
                  }
                }
              }
            }
          }

          var listOfVariants = [], variantDates = [];
          if(idea.variants.length > 0){
            for(var k = 0; k < idea.variants.length; k ++){
              if(idea.variants[k].components && idea.variants[k].components.indexOf(component['id'].toString()) > -1){
                listOfVariants.push(idea.variants[k]);
              }
            }
          }

          variantDates = _.map(listOfVariants, function(item){
            return [new Date(parseInt(item.name.substr(-13))).toString(), item.name];
          });

          Account.findOne({"username" : idea.inventorName}, function(err, ideaInventor){
            Account.findOne({"username" : component.creator}, function(err, componentContributor){
              if(component['problemID']){
                IdeaProblem.findOne({"_id" : component['problemID']}, function(err, problem){

                  //Get problem creator picture
                  Account.findOne({"username": problem['creator']}, function(err, problemCreator){

                    //assumes the first headshot in the user's array of headshots is their
                    // primary one for display
                    if(problemCreator['headshots']){
                      var problemHeadshotID = problemCreator['headshots'][0];
                      var problemHeadshotURL = '';
                    } else {
                      var problemHeadshotID, problemHeadshotURL, problemHeadshotStyle;
                    }

                    problem['wholeCreator'] = {
                      'nickname' : problemCreator['nickname']
                    };

                    //first get the images that the component is in
                    if(component.images.length > 0 || problemHeadshotID){
                      var imageIDs = _.map(component.images, function(item){ return item['imageID']});

                      if(problemHeadshotID){
                        imageIDs.push(problemHeadshotID);
                      }

                      IdeaImage.find({"_id" : {$in : imageIDs}}, function(err, images){
                        var imageURLs = [];
                        for(var i = 0; i < images.length; i++){
                          if(images[i] && images[i]['amazonURL']){
                            var imageStyle = "";
                            imageStyle = ideaSeedHelpers.getImageOrientation(images[i]["orientation"]);
                            var filename = images[i]["filename"];
                            //if it's the main component image, put in the first spot of the array so it's big on
                            // the component profile page
                            if(component.mainImage && images[i].id.toString() == component.mainImage.toString()){
                              imageURLs.unshift([
                                filename,
                                images[i]["amazonURL"],
                                imageStyle
                              ]);
                            } else if( images[i].id.toString() == problemCreator['headshots'][0]){
                              problemHeadshotURL = images[i]["amazonURL"];
                              problemHeadshotStyle = imageStyle;
                            } else {
                              imageURLs.push([
                                filename,
                                images[i]["amazonURL"],
                                imageStyle
                              ]);
                            }
                          }
                        }
                        problem['headshot'] = {
                          'url' : problemHeadshotURL,
                          'style' : problemHeadshotStyle
                        };

                        res.render('pages/ideas/component-profile-edit', {
                          csrfToken: req.csrfToken(),
                          user : req.user || {},
                          headshot : headshotURL,
                          headshotStyle : headshotStyle,
                          idea : idea._doc,
                          ideaInventor : ideaInventor,
                          componentContributor : componentContributor,
                          problemHeadshotURL : problemHeadshotURL,
                          component : component,
                          problem : problem,
                          parentComponents : parentComponents,
                          variantDates : variantDates,
                          imageURLs : imageURLs,
                          components : components,
                          relatedComponents : relatedComponents
                        });
                      });//end of image query

                    // in case theres no images
                    } else {
                          res.render('pages/ideas/component-profile-edit', {
                            csrfToken: req.csrfToken(),
                            user : req.user || {},
                            headshot : headshotURL,
                            headshotStyle : headshotStyle,
                            problemHeadshotURL : problemHeadshotURL,
                            idea : idea._doc,
                            ideaInventor : ideaInventor,
                            componentContributor : componentContributor,
                            components : components,
                            parentComponents : parentComponents,
                            component : component,
                            problem : problem,
                            variantDates : variantDates,
                            //problemAreas  : problemAreas,
                            imageURLs : [],
                            relatedComponents : relatedComponents
                            //components : components,
                            //listOfProblems : listOfProblems
                          });
                    }
                  }); // end of problem creator query
                });// end of problem query
              } else {
                  //first get the images that the component is in
                  if(component.images.length > 0 || component.mainImage){
                    var imageIDs = _.map(component.images || [], function(item){ return item['imageID']});


                    IdeaImage.find({"_id" : {$in : imageIDs}}, function(err, images){
                      var imageURLs = [];
                      for(var i = 0; i < images.length; i++){
                        var imageStyle = "";
                        imageStyle = ideaSeedHelpers.getImageOrientation(images[i]["orientation"]);
                        if(images[i] && images[i]["amazonURL"]){
                          var filename = images[i]["filename"];
                          //if it's the main component image, put in the first spot of the array so it's big on
                          // the component profile page
                          if(component.mainImage && images[i].id.toString() == component.mainImage.toString()){
                            imageURLs.unshift([
                              filename,
                              images[i]["amazonURL"],
                              imageStyle
                            ]);
                          } else {
                            imageURLs.push([
                              filename,
                              images[i]["amazonURL"],
                              imageStyle
                            ]);
                          }
                        }
                      }
                      res.render('pages/ideas/component-profile-edit', {
                        csrfToken: req.csrfToken(),
                        user : req.user || {},
                        headshot : headshotURL,
                        headshotStyle : headshotStyle,
                        idea : idea._doc,
                        ideaInventor : ideaInventor,
                        parentComponents : parentComponents,
                        componentContributor : componentContributor,
                        components : components,
                        component : component,
                        problem : "none",
                        variantDates : variantDates,
                        imageURLs : imageURLs,
                        relatedComponents : relatedComponents
                        //components : components,
                        //listOfProblems : listOfProblems
                      });

                    });//end of image query

                  // in case theres no images
                  } else {
                        res.render('pages/ideas/component-profile-edit', {
                          csrfToken: req.csrfToken(),
                          user : req.user || {},
                          headshot : headshotURL,
                          headshotStyle : headshotStyle,
                          idea : idea._doc,
                          ideaInventor : ideaInventor,
                          components : components,
                          componentContributor : componentContributor,
                          parentComponents : parentComponents,
                          component : component,
                          variantDates : variantDates,
                          problem : "none",
                          relatedComponents : relatedComponents,
                          imageURLs : []
                        });
                  }
              }
          }); //end of component contributor
          }); //end of idea inventor query
        }); // end of other component query
      });

    });// end of component query
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.post('/add-related-component', csrfProtection, function(req, res) {
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }
    var compIdentifier = req.body['component-identifier'];
    var relatedCompIdentifier = req.body['addRelatedComponent'];
    var relatedCompDescription = req.body['newRelatedComponentDesc'];

    Component.findOne({"identifier" : compIdentifier}, function(err, thisComponent){
      Component.findOne({"identifier" : relatedCompIdentifier}, function(err, otherComponent){

        var thisComponentName = thisComponent.text || thisComponent.descriptions[0] || "this component";
        var otherComponentName = otherComponent.text || otherComponent.descriptions[0] || "The other component";

        // add other component to this component
        var thisComponentRelatedComp = {
            "compID" : otherComponent['id'],
            "relationship"  : relatedCompDescription
        };
        if(req.body.subComponent){
          thisComponentRelatedComp['subComponent'] = "parent";
        }
        if(thisComponent.relatedComps.length > 0){
          thisComponent.relatedComps.push(thisComponentRelatedComp);
        } else {
          thisComponent.relatedComps = [thisComponentRelatedComp];
        }

        // add other component to this component
        var otherComponentRelatedComp = {
            "compID" : thisComponent['id'],
            "relationship"  : relatedCompDescription
        };
        if(req.body.subComponent){
          otherComponentRelatedComp['subComponent'] = "sub-component";
        }
        if(otherComponent.relatedComps.length > 0){
          otherComponent.relatedComps.push(otherComponentRelatedComp);
        } else {
          otherComponent.relatedComps = [otherComponentRelatedComp];
        }

        thisComponent.save(function(err){
          otherComponent.save(function(err){
            console.log('new related component added');
            if (err) return handleError(err);
            Account.findById( req.user.id,
              function (err, account) {
                account.einsteinPoints = account.einsteinPoints + 20;
                today = ideaSeedHelpers.getCurrentDate();
                if(account.einsteinHistory){
                  account.einsteinHistory.push("You earned 20 Einstein Points on " + today + " by adding a component relationship to your idea.");
                } else {
                  account.einsteinHistory = ["You earned 20 Einstein Points on " + today + " by adding a component relationship to your idea."];
                }
                account.save(function (err) {});
            });
            res.redirect('/component-profile/'+compIdentifier);
          });
        });

      });
    });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for adding a component title
******************************************************************
******************************************************************
*****************************************************************/
router.post('/add-component-title', csrfProtection, function(req, res) {
  if( !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }
    var compIdentifier = req.body['component-identifier'];
    var compTitle = req.body['compTitle'];

    Component.findOne({"identifier" : compIdentifier}, function(err, thisComponent){
      thisComponent.text = compTitle;

      thisComponent.save(function(err){
        if(err){ console.log("Error saving title.")}
        res.redirect('/component-profile/'+compIdentifier);
      });

    });
});


router.get('/sign-s3', csrfProtection, function(req, res) {
  var s3 = new aws.S3({
      accessKeyId : process.env.accessKeyId,
      secretAccessKey : process.env.secretAccessKey
  });
  var fileName = req.query['file-name'];
  var fileType = req.query['file-type'];
  var s3Params = {
    Bucket: 'qonspire',
    Key: fileName,
    Expires: 60,
    ContentType: fileType,
    ACL: 'public-read'
  };
  s3.getSignedUrl('putObject', s3Params, function(err, data) {
    if(err){
      console.log(err);
      return res.end();
    }
    var returnData = {
      signedRequest: data,
      url: 'https://qonspire.s3.amazonaws.com/'+fileName
    };
    res.write(JSON.stringify(returnData));
    res.end();
  });
});

router.get("/expose-idea-seed",csrfProtection, function(req, res){
  if( !(req.user && req.user.username && req.session.idea)){
      res.redirect('/');
      return;
  }
  IdeaSeed.findById(req.session.idea,function(err, idea){
    if(!idea){
      res.redirect('/');
      return;
    }
    idea.visibility = "public";
    idea.save(function(err, updatedDocument){
      res.sendStatus(200);
    })
  });
})

router.post('/set-session-redirect', csrfProtection, function(req, res){
  if(req.body.redirectURL) {
    req.session.loginPath = req.body.redirectURL;
    res.sendStatus(200);
  }
})

router.post("/add-image-title", csrfProtection, function(req, res){
  if( !(req.user && req.user.username && req.session.idea)){
      res.redirect('/');
      return;
  }

  IdeaImage.findOne({"filename" : req.body.imageFilename}, function(err, image){
    if(!image){
      res.redirect('/');
      return;
    } else{
      image.title = req.body.newTitle;
      image.save(function(err){
        if(err){
          res.redirect('/');
          return;
        }
        res.sendStatus(200);
      })
    }
  });
});



module.exports = router;
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
var sanitizer = require('sanitizer');
var mongoSanitize = require('mongo-sanitize');
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var ideaSeedHelpers = require('../helpers/idea-seed-helpers');

var S3_BUCKET = process.env.S3_BUCKET;

var storage = multer.memoryStorage();
var uploading = multer({
  storage: storage,
  dest: '../uploads/'
});

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
      prefix: "perf"
    }, 
    {
      name: "affordability",
      prefix: "afford"
    }, 
    {
      name: "featurability",
      prefix: "feature",
      iconId: "perfIcon" 
    },
    {
      name: "deliverability",
      prefix: "deliver",
      iconId: "deliverabilityIcon"
    }, 
    {
      name: "useability",
      prefix: "useability"
    }, 
    {
      name: "maintainability",
      prefix: "maintain",
      iconId: "maintainabilityIcon"
    }, 
    {
      name: "danger",
      link: "dangerous",
      prefix: "danger"
    }, 
    {
      name: "durability",
      prefix: "durability"
    }, 
    {
      name: "imageability",
      prefix: "imageability",
      sliderId: "imageSlider"
    }, 
    {
      name: "complexity",
      prefix: "complexity",
      sliderId: "complexSlider"
    }, 
    {
      name: "precision",
      prefix: "precision"
    }, 
    {
      name: "variability",
      prefix: "variability"
    }, 
    {
      name: "sensitivity",
      prefix: "sensitivity"
    }, 
    {
      name: "immaturity",
      prefix: "immaturity",
      sliderId: "immatureSlider"
    }, 
    {
      name: "skills",
      prefix: "skills"
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
      res.redirect('/imagineer/' + req.user.nickname);
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
      res.render('pages/login', {
        csrfToken: req.csrfToken(),
        showMessage : "You already have an account. Log in below"
      });
    }

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
  Account.findOne({ 'username' : req.body.username  }, function(err, user) {
    if(user){
      res.render('pages/login', {
        csrfToken: req.csrfToken(),
        showMessage : "You already have an account. Log in below"
      });
    }

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
  if (req.session.idea){
    req.session.idea = null;
  }

  Account.findById(req.user.id, function(err, account){

    if (err || !account){
      console.log('Error is ' + err);
      res.redirect('/');
      return;
    }

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
      });
      Aptitude.find({"_id" : {$in : account.aptitudes}}, function(err, myAptitudes){
        ideaSeedHelpers.getUserHeadshot(req).then(function(headshotData){
            var headshotURL = headshotData['headshotURL'];
            var headshotStyle = headshotData['headshotStyle'];

          var reviewNames, accountIdeaSeeds;
          if(account.ideaSeeds && account.ideaSeeds.length > 0){
            var ideaNames = [],
                j = 0;
            IdeaReview.find({"reviewer" : account.username}, function(err, reviews){
              var ideaSeedIDs = _.map(reviews, function(item){return item["ideaSeedId"];});
              ideaSeedIDs = _.filter(ideaSeedIDs, Boolean);
              IdeaSeed.find({_id : {$in : ideaSeedIDs}}, function(err, reviewedIdeas){
                var creationDate, formattedDate;
                var reviewedIdeaNames = _.map(reviewedIdeas, function(item){
                  creationDate = item._id.getTimestamp();
                  formattedDate = creationDate.getMonth().toString() + "-" +
                    creationDate.getDate().toString() + "-" +
                    creationDate.getFullYear().toString();
                  return [item["name"], formattedDate];
                });
                var context = {"reviewedNames" : reviewedIdeaNames};
                _.each(account.ideaSeeds, function(element, index,  list){
                  reviewNames = this["reviewedNames"];
                  (function(reviewNames){
                    IdeaSeed.findById(element._id, function(error, document){
                      j++;
                      if(document){
                        creationDate = document._id.getTimestamp();
                        formattedDate = creationDate.getMonth().toString() + "-" +
                          creationDate.getDate().toString() + "-" +
                          creationDate.getFullYear().toString();
                        ideaNames.push([document.name, formattedDate]);
                        if(j == account.ideaSeeds.length){
                          return res.render('pages/imagineer', {
                            csrfToken: req.csrfToken(),
                            reviewNames : reviewNames,
                            headshot : headshotURL,
                            headshotStyle : headshotStyle,
                            user : req.user || {} || {},
                            profileAccount: account,
                            aptitudes : myAptitudes,
                            schoolNetwork : schoolNetwork,
                            locationNetwork : locationNetwork,
                            companyNetwork : companyNetwork,
                            accountIdeaSeeds : ideaNames,
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
                      } else {
                        if(j == account.ideaSeeds.length){
                          return res.render('pages/imagineer', {
                            csrfToken: req.csrfToken(),
                            reviewNames : reviewNames,
                            myAptitudes : myAptitudes,
                            headshot : headshotURL,
                            headshotStyle : headshotStyle,
                            schoolNetwork : schoolNetwork,
                            locationNetwork : locationNetwork,
                            companyNetwork : companyNetwork,
                            user : req.user || {} || {},
                            profileAccount: account,
                            accountIdeaSeeds : ideaNames
                          });
                        }
                      }
                    });
                  }(reviewNames));
                }, context); //each
              });
            });
          }
          else {
            return res.render('pages/imagineer', {
              csrfToken: req.csrfToken(),
              user : req.user || {} || {},
              profileAccount: account,
              reviewNames : reviewNames,
              aptitudes : myAptitudes,
              headshot : headshotURL,
              headshotStyle : headshotStyle,
              schoolNetwork : schoolNetwork,
              locationNetwork : locationNetwork,
              companyNetwork : companyNetwork,
              accountIdeaSeeds : accountIdeaSeeds
            });
          }
        });
      }); //end of the aptitude query
    }); // End of Network query
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
router.get('/imagineer-picture', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  ideaSeedHelpers.getUserHeadshot(req).then(function(headshotData){
      var headshotURL = headshotData['headshotURL'];
      var headshotStyle = headshotData['headshotStyle'];


    var headshotIDs = _.map(req.user.headshots, function(image){
      return image.toString();
    })

    IdeaImage.find({"_id" : { $in : headshotIDs}}, function(err, images){

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
        });
      
        Aptitude.find({"_id" : {$in : req.user.aptitudes}}, function(err, myAptitudes){
          if(req.user.ideaSeeds && req.user.ideaSeeds.length > 0){
            var ideaNames = [],
                j = 0;
            IdeaReview.find({"reviewer" : req.user.username}, function(err, reviews){
              var ideaSeedIDs = _.map(reviews, function(item){return item["ideaSeedId"];});
              ideaSeedIDs = _.filter(ideaSeedIDs, Boolean);
              IdeaSeed.find({_id : {$in : ideaSeedIDs}}, function(err, reviewedIdeas){
                var creationDate, formattedDate;
                var reviewedIdeaNames = _.map(reviewedIdeas, function(item){
                  creationDate = item._id.getTimestamp();
                  formattedDate = creationDate.getMonth().toString() + "-" +
                    creationDate.getDate().toString() + "-" +
                    creationDate.getFullYear().toString();
                  return [item["name"], formattedDate];
                });
                var context = {"reviewedNames" : reviewedIdeaNames};
                _.each(req.user.ideaSeeds, function(element, index,  list){
                  reviewNames = this["reviewedNames"];
                  (function(reviewNames){
                    IdeaSeed.findById(element._id, function(error, document){
                      j++;
                      if(document){
                        creationDate = document._id.getTimestamp();
                        formattedDate = creationDate.getMonth().toString() + "-" +
                          creationDate.getDate().toString() + "-" +
                          creationDate.getFullYear().toString();
                        ideaNames.push([document.name, formattedDate]);
                        if(j == req.user.ideaSeeds.length){


                                var imageURLs = [];
                                var profilePictureFilename = "";
                                if(images && images.length > 0){
                                  for(var i=0; i < images.length; i++){
                                    var imageStyle = "";
                                    switch (images[i]["orientation"]) {
                                      case 1 :
                                        imageStyle = "";
                                        break;
                                      case 2 :
                                        imageStyle = "-webkit-transform: rotate(90deg);-moz-transform: rotate(90deg);-o-transform: rotate(90deg);-ms-transform: rotate(90deg);transform: rotate(90deg);";
                                        break;
                                      case 3 :
                                        imageStyle = "-webkit-transform: rotate(180deg);-moz-transform: rotate(180deg);-o-transform: rotate(180deg);-ms-transform: rotate(180deg);transform: rotate(180deg);";
                                        break;
                                      case 4 :
                                        imageStyle = "-webkit-transform: rotate(270deg);-moz-transform: rotate(270deg);-o-transform: rotate(270deg);-ms-transform: rotate(270deg);transform: rotate(270deg);";
                                        break;
                                    }
                                    //get the first image listed in the accounts headshots, use this as the
                                    // primary one to display in the header bar
                                    if(images[i].id.toString() == req.user.headshots[0]){
                                      profilePictureFilename = images[i].filename;
                                    }

                                    var filename = images[i]._doc["filename"];
                                    if(images[i]._doc["image"]){
                                    } else {
                                      imageURLs.push([
                                        filename,
                                        images[i]._doc["amazonURL"],
                                        imageStyle
                                      ]);
                                    }
                                  }
                                  res.render('pages/imagineer-picture', {
                                    csrfToken: req.csrfToken(),
                                    user : req.user || {},
                                    imageURLs : imageURLs,
                                    aptitudes : myAptitudes,
                                    reviewNames : reviewNames,
                                    accountIdeaSeeds : ideaNames,
                                    schoolNetwork : schoolNetwork,
                                    locationNetwork : locationNetwork,
                                    companyNetwork : companyNetwork,
                                    headshotStyle : headshotStyle,
                                    headshot : headshotURL,
                                    profilePictureFilename : profilePictureFilename
                                  });
                                } else {
                                  res.render('pages/imagineer-picture', {
                                    csrfToken: req.csrfToken(),
                                    reviewNames : reviewNames,
                                    user : req.user || {},
                                    aptitudes : myAptitudes,
                                    schoolNetwork : schoolNetwork,
                                    accountIdeaSeeds : ideaNames,
                                    locationNetwork : locationNetwork,
                                    companyNetwork : companyNetwork,
                                    headshot : headshotURL,
                                    headshotStyle : headshotStyle,
                                    imageURLs : [],
                                    profilePictureFilename : ""
                                  });
                                }
                        }
                      }
                    });
                  }(reviewNames));
                }); //each
              });
            });
          } else {
            res.render('pages/imagineer-picture', {
              csrfToken: req.csrfToken(),
              reviewNames : reviewNames,
              user : req.user || {},
              aptitudes : myAptitudes,
              schoolNetwork : schoolNetwork,
              accountIdeaSeeds : ideaNames,
              locationNetwork : locationNetwork,
              companyNetwork : companyNetwork,
              headshot : headshotURL,
              headshotStyle : headshotStyle,
              imageURLs : [],
              profilePictureFilename : ""
            });
          }
        });
      });
    });
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
  //aint return shit if there's no user, ie empty string
  ideaSeedHelpers.getUserHeadshot(req).then(function(headshotData){
      var headshotURL = headshotData['headshotURL'];
      var headshotStyle = headshotData['headshotStyle'];

      IdeaSeed.find({}).sort({$natural: -1})
        .exec(function(err, ideas){
        var wasteValueScores = [0, 0];

        //get the first image for each idea for now
        var imageList = _.map(ideas, function(idea){
          return idea.images[0];
        });

        IdeaImage.find({"_id" : { $in : imageList}}, function(err, images){
          if(err){ console.log("error is " + err)}
          var currentImage;
          var currentImageStyle;
          var ideaList = _.map(ideas, function(idea){
            wasteValueScores = IdeaSeed.getWasteValueScores(idea);

            //get the image document corresponding to the first image ID
            // for each individual idea
            for (var i = 0; i < images.length; i++){
              if(idea.images.length > 0 &&
                idea.images[0].toString() == images[i].id.toString()){
                currentImage = images[i]._doc["amazonURL"] || "";
                currentImageStyle = "";
                switch (images[i]._doc["orientation"]) {
                  case 1 :
                    currentImageStyle = "";
                    break;
                  case 2 :
                    currentImageStyle = "-webkit-transform: rotate(90deg);-moz-transform: rotate(90deg);-o-transform: rotate(90deg);-ms-transform: rotate(90deg);transform: rotate(90deg);";
                    break;
                  case 3 :
                    currentImageStyle = "-webkit-transform: rotate(180deg);-moz-transform: rotate(180deg);-o-transform: rotate(180deg);-ms-transform: rotate(180deg);transform: rotate(180deg);";
                    break;
                  case 4 :
                    currentImageStyle = "-webkit-transform: rotate(270deg);-moz-transform: rotate(270deg);-o-transform: rotate(270deg);-ms-transform: rotate(270deg);transform: rotate(270deg);";
                    break;
                }
                break;
              } else if (idea.images.length == 0){
                currentImage = "";
                currentImageStyle = "";
                break;
              }
            }

            return [
              idea['name'], //String
              idea['description'], //String
              wasteValueScores, //array of two numbers
              idea['inventorName'],
              currentImage,
              currentImageStyle
            ];
          });

          var inventorList = _.map(ideaList, function(idea){
            return idea[3];
          })

          Account.find({"username" : {$in : inventorList}},
            function(err, accounts){
              if(err){ console.log("error is " + err)}
              var accountPictures = _.map(accounts, function(account){
                if(account.headshots){
                  return account.headshots[0];
                } else {
                  return "";
                }
              });

              accountPictures = _.without(accountPictures, "");
              IdeaImage.find({"_id" : {$in : accountPictures}}, function(err, profilePictures){
                if(err){ console.log("error is " + err)}
                if(profilePictures){
                  //find which ideaList item is connected to the right profile picture
                  for(var j=0; j < ideaList.length; j++){
                    //find the account with the right username
                    for(var k = 0; k < accounts.length; k++){
                      if(accounts[k].username == ideaList[j][3]){
                        //find the profile picture with the id that matches the accounts
                        // first profile picture ID and attach it to the ideaList
                        if(accounts[k].headshots && accounts[k].headshots[0]){
                          for(var n = 0; n < profilePictures.length; n++){
                            if(profilePictures[n]["id"].toString() == accounts[k].headshots[0].toString()
                              && profilePictures[n]["amazonURL"]){
                              ideaList[j].push(profilePictures[n]["amazonURL"]);
                              var creatorHeadshotStyle = "";
                              switch (profilePictures[n]["orientation"]) {
                                case 1 :
                                  ideaList[j].push("");
                                  break;
                                case 2 :
                                  ideaList[j].push("-webkit-transform: rotate(90deg);-moz-transform: rotate(90deg);-o-transform: rotate(90deg);-ms-transform: rotate(90deg);transform: rotate(90deg);");
                                  break;
                                case 3 :
                                  ideaList[j].push("-webkit-transform: rotate(180deg);-moz-transform: rotate(180deg);-o-transform: rotate(180deg);-ms-transform: rotate(180deg);transform: rotate(180deg);");
                                  break;
                                case 4 :
                                  ideaList[j].push("-webkit-transform: rotate(270deg);-moz-transform: rotate(270deg);-o-transform: rotate(270deg);-ms-transform: rotate(270deg);transform: rotate(270deg);");
                                  break;
                              }

                            }
                          }
                        }
                      }

                    }
                  }

                  res.render('pages/ideas', {
                    csrfToken: req.csrfToken(),
                    user : req.user || {} || {},
                    headshot : headshotURL,
                    headshotStyle : headshotStyle,
                    ideas : ideaList
                  });
                } else {
                  res.render('pages/ideas', {
                    csrfToken: req.csrfToken(),
                    user : req.user || {} || {},
                    headshot : headshotURL,
                    headshotStyle : headshotStyle,
                    ideas : ideaList
                  });
                }
              });
            }
          )
        });
      });
    });
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
  ideaSeedHelpers.getUserHeadshot(req).then(function(headshotData){
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
        res.render('pages/introduce-idea', { user : req.user || {}, idea : req.session.idea, csrfToken: req.csrfToken() });
      } else {
        IdeaSeed.findById(req.session.idea,function(err, idea){
          currentIdea = idea._doc;
          res.render('pages/introduce-idea', { user : req.user || {},
            csrfToken: req.csrfToken(),
            headshot : headshotURL,
            headshotStyle : headshotStyle,
            idea : currentIdea });
        });
      }
    });
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
  IdeaSeed.update({_id : req.session.idea}, {
    problem : req.body.purposeFor.slice(15)},
    { multi: false }, function (err, raw) {
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
  ideaSeedHelpers.getUserHeadshot(req).then(function(headshotData){
      var headshotURL = headshotData['headshotURL'];
      var headshotStyle = headshotData['headshotStyle'];

    IdeaSeed.findById(req.session.idea,function(err, idea){
      currentIdea = idea._doc;
      res.render('pages/accomplish', { user : req.user || {},
        csrfToken: req.csrfToken(),
        headshot: headshotURL,
        headshotStyle : headshotStyle,
        idea : currentIdea });
    });
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
  IdeaSeed.update({_id : req.session.idea}, {
    description : req.body.purposeHow.slice(16)},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/image-upload');
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
      identifier : "comp-"+Date.now()
    };

    Account.findById( req.user.id,
      function (err, account) {
        var points = parseInt(req.body.pointValue.slice(1));
        account.einsteinPoints = account.einsteinPoints + points;
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

    var newSuggestion = {
      descriptions : [req.body.suggestionText.slice(16)], //getting rid of "the solution of "
      category : suggestionCategory,
      creator : req.user.username,
      ideaSeed : req.session.idea,
      problemID : problem.id,
      date: Date.now(),
      identifier : "comp-"+Date.now()
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
                var points = 50;
                account.einsteinPoints = account.einsteinPoints + points;
                account.save(function (err) {});
            });
            Component.create(newSuggestion,
              function(err, raw){
                console.log('The raw response from Mongo was ', raw);
                res.redirect('/imperfection-profile/' + problem.identifier);
              }
            );
          }
        });
      });
    } else {
      Account.findById( req.user.id,
        function (err, account) {
          var points = 50;
          account.einsteinPoints = account.einsteinPoints + points;
          account.save(function (err) {});
      });
      Component.create(newSuggestion,
        function(err, raw){
          console.log('The raw response from Mongo was ', raw);
          res.redirect('/imperfection-profile/' + problem.identifier);
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

  debugger;

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
    name : req.body.inventionName.slice(17)},
    // options, this gets the new updated record
    { multi: false, new : true },
    function (err, idea) {
      console.log('The raw response from Mongo was ', idea);
      res.redirect('/ideas/' + idea.name);
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

    } else {

      IdeaReview.findById( req.session.ideaReview._id, function(error, currentReview){
        if(error){
          console.error('ERROR! ' + error);
          res.json({});
        } else if (!currentReview){
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
  ideaSeedHelpers.getUserHeadshot(req).then(function(headshotData){
      var headshotURL = headshotData['headshotURL'];
      var headshotStyle = headshotData['headshotStyle'];

    IdeaSeed.findById(req.session.idea,function(err, idea){
      var imageURLs = [];
      currentIdea = idea._doc;
      if (idea._doc.images.length != 0){
        for (var i =0; i < idea._doc.images.length; i++){
          var j = 0;
          IdeaImage.findOne({"_id" : idea._doc.images[i]}, function(err, image){
            j++;
            if(image && image._doc && image._doc.amazonURL){
              var filename = image._doc["filename"];
              var imageStyle = "";
              switch (image["orientation"]) {
                case 1 :
                  imageStyle = "";
                  break;
                case 2 :
                  imageStyle = "-webkit-transform: rotate(90deg);-moz-transform: rotate(90deg);-o-transform: rotate(90deg);-ms-transform: rotate(90deg);transform: rotate(90deg);";
                  break;
                case 3 :
                  imageStyle = "-webkit-transform: rotate(180deg);-moz-transform: rotate(180deg);-o-transform: rotate(180deg);-ms-transform: rotate(180deg);transform: rotate(180deg);";
                  break;
                case 4 :
                  imageStyle = "-webkit-transform: rotate(270deg);-moz-transform: rotate(270deg);-o-transform: rotate(270deg);-ms-transform: rotate(270deg);transform: rotate(270deg);";
                  break;
              }
              imageURLs.push([
                filename,
                image["amazonURL"],
                image._doc["uploader"],
                imageStyle
              ]);
            }
            if (j == idea._doc.images.length){
              if(req.session.ideaReview && idea.inventorName != req.user.username){ var reviewing = true; }
              else { var reviewing = false; }
              res.render('pages/image-upload', {
                csrfToken: req.csrfToken(),
                user : req.user || {},
                headshot: headshotURL,
                headshotStyle : headshotStyle,
                idea : currentIdea,
                imageURLs : imageURLs,
                reviewing: reviewing
              });
            }
          });
        }
      } else {
        if(req.session.ideaReview && idea.inventorName != req.user.username){ var reviewing = true; }
        else { var reviewing = false; }

        res.render('pages/image-upload', { user : req.user || {},
          csrfToken: req.csrfToken(),
          headshot: headshotURL,
          headshotStyle : headshotStyle,
          idea : currentIdea, imageURLs : [], reviewing: reviewing });
      }
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
              res.json({"redirectURL" : '/annotate-image/'+newFileName});
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

      image.save(function(err, newReceipt){
        if (err) {
          console.log(err);
        } else {
          IdeaSeed.update(
              { _id : req.session.idea },
              { $set : { applicationReceipt : newReceipt.id }},
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
  ideaSeedHelpers.getUserHeadshot(req).then(function(headshotData){
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
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for rendering the page to create a new variant
******************************************************************
******************************************************************
*****************************************************************/
router.get('/view-idea-suggestions', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  ideaSeedHelpers.getUserHeadshot(req).then(function(headshotData){
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
            switch (image["orientation"]) {
              case 1 :
                imageStyle = "";
                break;
              case 2 :
                imageStyle = "-webkit-transform: rotate(90deg);-moz-transform: rotate(90deg);-o-transform: rotate(90deg);-ms-transform: rotate(90deg);transform: rotate(90deg);";
                break;
              case 3 :
                imageStyle = "-webkit-transform: rotate(180deg);-moz-transform: rotate(180deg);-o-transform: rotate(180deg);-ms-transform: rotate(180deg);transform: rotate(180deg);";
                break;
              case 4 :
                imageStyle = "-webkit-transform: rotate(270deg);-moz-transform: rotate(270deg);-o-transform: rotate(270deg);-ms-transform: rotate(270deg);transform: rotate(270deg);";
                break;
            }
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
                switch (headshots[j]["orientation"]) {
                  case 1 :
                    headshotURLs[headshots[j]['uploader']].push("");
                    break;
                  case 2 :
                    headshotURLs[headshots[j]['uploader']].push("-webkit-transform: rotate(90deg);-moz-transform: rotate(90deg);-o-transform: rotate(90deg);-ms-transform: rotate(90deg);transform: rotate(90deg);");
                    break;
                  case 3 :
                    headshotURLs[headshots[j]['uploader']].push("-webkit-transform: rotate(180deg);-moz-transform: rotate(180deg);-o-transform: rotate(180deg);-ms-transform: rotate(180deg);transform: rotate(180deg);");
                    break;
                  case 4 :
                    headshotURLs[headshots[j]['uploader']].push("-webkit-transform: rotate(270deg);-moz-transform: rotate(270deg);-o-transform: rotate(270deg);-ms-transform: rotate(270deg);transform: rotate(270deg);");
                    break;
                }

              }

              currentIdea = idea._doc;
              res.render('pages/view-idea-suggestions', {
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
  ideaSeedHelpers.getUserHeadshot(req).then(function(headshotData){
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
        _.each(suggestions, function(element,index){
          newVariant.contributorsSignedOff[element.creator] = "No Email Sent";
          newVariant.contributorContracts[element.creator] = "no contract yet";
        });
        //this tells mongoose to save the mixed field of contributors
        // when save is called below

        newVariant["components"] = incorporatedSuggestions;
        newVariant["images"] = incorporatedImages;

        idea.variants.set(idea.variants.length -1, newVariant);

        idea.markModified('variants');

        idea.save(function(err, data){
          res.redirect('/ideas/' + idea.name);
        });
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
        return res.redirect('/imagineer/' + user.nickname);
      });
    })(req, res, next);

});


router.post('/login-dsw', csrfProtection, function(req,res, next){
    passport.authenticate('local', function(err, user, info) {
      if (err) { return next(err); }
      if (!user) {
        return res.redirect('/login/failed-login');
      }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.redirect('/jam/dsw');
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

  query.exec(function(err, idea){

    if(err || !idea){
      res.redirect('/');
      return;
    }

    req.session.idea = idea.id;

    ideaSeedHelpers.getUserHeadshot(req).then(function(headshotData){
      var headshotURL = headshotData['headshotURL'];
      var headshotStyle = headshotData['headshotStyle'];

      IdeaSeed.findById(req.session.idea,function(err, idea){
        currentIdea = idea._doc;

        ideaSeedHelpers.getApplicationStrength(idea.id)
          .then(function(strengthResponse){

            IdeaProblem.find({"ideaSeed" : currentIdea._id, date : {$exists : true}}, null,
              {sort: '-date'}, function(err, problems){
                _.each(problems, function(value, key, list){
                    Account.findOne({"username": value.creator}, function(err, user) {
                      value.wholeCreator = user;
                    });
                });

              Component.find({"ideaSeed" : idea.id}, function(err, components){
                var variantDates = [],
                    sortedProblems = [];
                var imageURLs = [];
                var componentsList = [];
                componentsList = _.map(components, function(item){return "Component : "+item['text'];});
                componentsList = componentsList.filter(function(item){
                  if(item == "Component : undefined"){
                    return false;
                  } else {
                    return true;
                  }
                });
                var problemAreas = componentsList.concat([
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
                ]);

                var listOfProblems = IdeaSeed.getListOfInventorProblems(currentIdea) || [];
                var typeOfProblem, rankingOfProblem;
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
                IdeaReview.find({"reviewer" : req.user.username, "ideaSeedId" : idea.id}, function(err, review){


                                Aptitude.find({"_id" : {$in : idea.aptitudes}}, function(err, myAptitudes){
                                  IdeaImage.findOne({"_id" : idea.applicationReceipt}, function(err, receipt){
                                    if (idea._doc.images.length !== 0){
                                      for (i =0; i < idea._doc.images.length; i++){
                                        var j = 0;
                                        IdeaImage.findOne({"_id" : idea._doc.images[i]}, function(err, image){
                                          j++;
                                          if(image && image._doc && image.amazonURL){
                                            var filename = image._doc["filename"];
                                            var imageStyle = "";
                                            switch (image["orientation"]) {
                                              case 1 :
                                                imageStyle = "";
                                                break;
                                              case 2 :
                                                imageStyle = "-webkit-transform: rotate(90deg);-moz-transform: rotate(90deg);-o-transform: rotate(90deg);-ms-transform: rotate(90deg);transform: rotate(90deg);";
                                                break;
                                              case 3 :
                                                imageStyle = "-webkit-transform: rotate(180deg);-moz-transform: rotate(180deg);-o-transform: rotate(180deg);-ms-transform: rotate(180deg);transform: rotate(180deg);";
                                                break;
                                              case 4 :
                                                imageStyle = "-webkit-transform: rotate(270deg);-moz-transform: rotate(270deg);-o-transform: rotate(270deg);-ms-transform: rotate(270deg);transform: rotate(270deg);";
                                                break;
                                            }
                                            imageURLs.push([
                                              filename,
                                              image["amazonURL"],
                                              imageStyle
                                            ]);
                                          }
                                          if (j == idea._doc.images.length){
                                            res.render('pages/ideas-single', { user : req.user || {}, idea : currentIdea,
                                              review : review || {},
                                              csrfToken: req.csrfToken(),
                                              variantDates : variantDates,
                                              receipt : receipt,
                                              strengthResponse : strengthResponse,
                                              appStrengthText : strengthResponse['appStrengthText'] || "" ,
                                              appStrengthClass : strengthResponse['appStrengthClass'] || "" ,
                                              problemAreas  : problemAreas,
                                              aptitudes : myAptitudes,
                                              headshot : headshotURL,
                                              headshotStyle : headshotStyle,
                                              imageURLs : imageURLs,
                                              inventorName : idea.inventorName,
                                              problems : problems,
                                              components : components,
                                              viabilities : viabilities,
                                              listOfProblems : listOfProblems });
                                          }
                                        });
                                      }
                                    } else {
                                            res.render('pages/ideas-single', { user : req.user || {}, idea : currentIdea,
                                              review : review || {},
                                              csrfToken: req.csrfToken(),
                                              variantDates : variantDates,
                                              receipt : receipt,
                                              problemAreas  : problemAreas,
                                              aptitudes : myAptitudes,
                                              strengthResponse : strengthResponse,
                                              appStrengthText : strengthResponse['appStrengthText'],
                                              appStrengthClass : strengthResponse['appStrengthClass'],
                                              imageURLs : [],
                                              inventorName : idea.inventorName,
                                              headshot : headshotURL,
                                              headshotStyle : headshotStyle,
                                              problems : problems,
                                              components : components,
                                              viabilities : viabilities,                                          
                                              listOfProblems : listOfProblems });
                                    }
                                  });
                                }); //end of aptitude query
              }); // end of the review query



              }); //end of components query
            }); // end of idea problems query

        });
      });
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
router.get('/create-application', csrfProtection, function(req, res){
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  var currentAccount;
  Account.findById( req.user.id,
    function (err, account) {
      currentAccount = account._doc;
      IdeaSeed.findById(req.session.idea,function(err, idea){
        currentIdea = idea._doc;
        IdeaProblem.find({"_id" : { $in : idea.problemPriorities}}, function(err, problems){
          IdeaImage.find({"_id" : { $in : idea.images}}, function(err, images){
            images = _.filter(images, function(item){return item.amazonURL});

            Component.find({"ideaSeed" : idea.id}, function(err, comps){

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
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/ideas/:ideaSeedName/variant/:variantname', csrfProtection, function(req, res){

  if(!req.session.idea || !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  ideaSeedHelpers.getUserHeadshot(req).then(function(headshotData){
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
            switch (image["orientation"]) {
              case 1 :
                imageStyle = "";
                break;
              case 2 :
                imageStyle = "-webkit-transform: rotate(90deg);-moz-transform: rotate(90deg);-o-transform: rotate(90deg);-ms-transform: rotate(90deg);transform: rotate(90deg);";
                break;
              case 3 :
                imageStyle = "-webkit-transform: rotate(180deg);-moz-transform: rotate(180deg);-o-transform: rotate(180deg);-ms-transform: rotate(180deg);transform: rotate(180deg);";
                break;
              case 4 :
                imageStyle = "-webkit-transform: rotate(270deg);-moz-transform: rotate(270deg);-o-transform: rotate(270deg);-ms-transform: rotate(270deg);transform: rotate(270deg);";
                break;
            }
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
                  switch (headshots[j]["orientation"]) {
                    case 1 :
                      headshotURLs[headshots[j]['uploader']].push("");
                      break;
                    case 2 :
                      headshotURLs[headshots[j]['uploader']].push("-webkit-transform: rotate(90deg);-moz-transform: rotate(90deg);-o-transform: rotate(90deg);-ms-transform: rotate(90deg);transform: rotate(90deg);");
                      break;
                    case 3 :
                      headshotURLs[headshots[j]['uploader']].push("-webkit-transform: rotate(180deg);-moz-transform: rotate(180deg);-o-transform: rotate(180deg);-ms-transform: rotate(180deg);transform: rotate(180deg);");
                      break;
                    case 4 :
                      headshotURLs[headshots[j]['uploader']].push("-webkit-transform: rotate(270deg);-moz-transform: rotate(270deg);-o-transform: rotate(270deg);-ms-transform: rotate(270deg);transform: rotate(270deg);");
                      break;
                  }

                }

                var allSignedOff = true;
                _.each(currentVariant.contributorsSignedOff, function(value, key){
                  if(value != "Approved"){
                    allSignedOff = false;
                  }
                });

                res.render('pages/variant', { user : req.user || {}, idea : currentIdea,
                  csrfToken: req.csrfToken(),
                  suggestionsList : suggestionsList,
                  variantName : req.params.variantname,
                  images : imageList,
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
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/ideas/:ideaSeedName/variant/:variantname/contract/:contributorName', csrfProtection, function(req, res){

  if(!req.session.idea || !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  ideaSeedHelpers.getUserHeadshot(req).then(function(headshotData){
    var headshotURL = headshotData['headshotURL'];
    var headshotStyle = headshotData['headshotStyle'];
    IdeaSeed.findById(req.session.idea,function(err, idea){
      var currentIdea = idea._doc;
      res.render('pages/variant-contract', { user : req.user || {},
        idea : currentIdea,
        csrfToken: req.csrfToken(),
        contributorUsername : req.params.contributorName,
        variantName : req.params.variantname
      });
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
  ideaSeedHelpers.getUserHeadshot(req).then(function(headshotData){
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
        currentVariant['contributorsSignedOff'][req.body.contributorUsername] = "Approved";
        if (contractInfo['filename'] && contractInfo['location'] && currentVariant['contributorContracts']){
          currentVariant['contributorContracts'][req.body.contributorUsername] = {
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
  ideaSeedHelpers.getUserHeadshot(req).then(function(headshotData){
    var headshotURL = headshotData['headshotURL'];
    var headshotStyle = headshotData['headshotStyle'];

    IdeaImage.findOne({"filename": req.params.image} ,function(err, image){
      currentImage = image._doc;
      var annotations = [];
      if(currentImage.amazonURL){
        imageURL = currentImage.amazonURL;
        var imageStyle = "";
        switch (currentImage["orientation"]) {
          case 1 :
            imageStyle = "";
            break;
          case 2 :
            imageStyle = "-webkit-transform: rotate(90deg);-moz-transform: rotate(90deg);-o-transform: rotate(90deg);-ms-transform: rotate(90deg);transform: rotate(90deg);";
            break;
          case 3 :
            imageStyle = "-webkit-transform: rotate(180deg);-moz-transform: rotate(180deg);-o-transform: rotate(180deg);-ms-transform: rotate(180deg);transform: rotate(180deg);";
            break;
          case 4 :
            imageStyle = "-webkit-transform: rotate(270deg);-moz-transform: rotate(270deg);-o-transform: rotate(270deg);-ms-transform: rotate(270deg);transform: rotate(270deg);";
            break;
        }

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
                if ( comps[j]['ideaSeed'] && comps[j]['ideaSeed'].toString() ==  req.session.idea ) {
                  masterComponentList.push(comps[j]);
                  nextNumber++;
                }
              }

              compArray = _.sortBy(compArray, 'number');
              masterComponentList = _.sortBy(masterComponentList, 'number');
              res.render('pages/annotate-image', {
                csrfToken: req.csrfToken(),
                user : req.user || {},
                imgURL : imageURL,
                imageStyle : imageStyle,
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
      switch (currentImage["orientation"]) {
        case 1 :
          imageStyle = "";
          break;
        case 2 :
          imageStyle = "-webkit-transform: rotate(90deg);-moz-transform: rotate(90deg);-o-transform: rotate(90deg);-ms-transform: rotate(90deg);transform: rotate(90deg);";
          break;
        case 3 :
          imageStyle = "-webkit-transform: rotate(180deg);-moz-transform: rotate(180deg);-o-transform: rotate(180deg);-ms-transform: rotate(180deg);transform: rotate(180deg);";
          break;
        case 4 :
          imageStyle = "-webkit-transform: rotate(270deg);-moz-transform: rotate(270deg);-o-transform: rotate(270deg);-ms-transform: rotate(270deg);transform: rotate(270deg);";
          break;
      }

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

    req.body.component = req.body.component.slice(16); //get rid of "the solution of "

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
          var stop;
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
          identifier  : "comp-"+Date.now()
        });
        newComp.save(function(err){
          var stop;
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
* Route for viewing all viabilities
******************************************************************
******************************************************************
*****************************************************************/
router.get('/view-all-viabilities', csrfProtection, function(req, res) {
  res.render('partials/viability-overview-modal',
    { user : req.user || {}, headshot : headshotURL, idea : req.session.idea, csrfToken: req.csrfToken() }
  );
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
  } else {
    res.sendStatus(200)
  }
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
* Route for imperfection profile
******************************************************************
******************************************************************
*****************************************************************/
router.get('/imperfection-profile/:identifier', csrfProtection, function(req, res){

  //coming from jam page
  if (!req.session.idea && req.params.identifier) {
    IdeaProblem.findOne({
      "identifier" : req.params.identifier
      }, function(err, ideaProblem){
        IdeaSeed.findById(ideaProblem.ideaSeed, function(err, idea){
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
        Component.find({
          "problemID" : ideaProblem.id
          }, function(err, suggestions){
            res.render('pages/imperfection-profile', {
              csrfToken: req.csrfToken(),
              problem : ideaProblem,
              idea : idea || {},
              problemCreator : problemCreator,
              user : req.user || {},
              suggestions: suggestions,
              targets: targetConstants,
              tactics: tacticConstants
            });
          }).sort({date: -1});
      })
    });
  });
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for component profile
******************************************************************
******************************************************************
*****************************************************************/
router.get('/component-profile/:identifier', csrfProtection, function(req, res){
  if(!req.session.idea || !(req.user && req.user.username)){
    res.redirect('/');
    return;
  }

  ideaSeedHelpers.getUserHeadshot(req).then(function(headshotData){
    var headshotURL = headshotData['headshotURL'];
    var headshotStyle = headshotData['headshotStyle'];

    Component.findOne({"identifier" : req.params.identifier}, function(err, component){
      IdeaSeed.findById(req.session.idea,function(err, idea){

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
                  relatedComponents.push([components[j], compDescription]);
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


          if(component['problemID']){
            IdeaProblem.findOne({"_id" : component['problemID']}, function(err, problem){

              //Get problem creator picture
              Account.findOne({"username": problem['creator']}, function(err, problemCreator){

                //assumes the first headshot in the user's array of headshots is their
                // primary one for display
                var problemHeadshotID = problemCreator['headshots'][0];
                var problemHeadshotURL = '';

                //first get the images that the component is in
                if(component.images.length > 0 || problemHeadshotID){
                  var imageIDs = _.map(component.images, function(item){ return item['imageID']});

                  // add main component image to list of id's to be retrieved
                  if(component.mainImage){
                    imageIDs.unshift(component.mainImage);
                  }
                  if(problemHeadshotID){
                    imageIDs.push(problemHeadshotID);
                  }

                  IdeaImage.find({"_id" : {$in : imageIDs}}, function(err, images){
                    var imageURLs = [];
                    for(var i = 0; i < images.length; i++){
                      if(images[i] && images[i]['amazonURL']){
                        var imageStyle = "";
                        switch (images[i]["orientation"]) {
                          case 1 :
                            imageStyle = "";
                            break;
                          case 2 :
                            imageStyle = "-webkit-transform: rotate(90deg);-moz-transform: rotate(90deg);-o-transform: rotate(90deg);-ms-transform: rotate(90deg);transform: rotate(90deg);";
                            break;
                          case 3 :
                            imageStyle = "-webkit-transform: rotate(180deg);-moz-transform: rotate(180deg);-o-transform: rotate(180deg);-ms-transform: rotate(180deg);transform: rotate(180deg);";
                            break;
                          case 4 :
                            imageStyle = "-webkit-transform: rotate(270deg);-moz-transform: rotate(270deg);-o-transform: rotate(270deg);-ms-transform: rotate(270deg);transform: rotate(270deg);";
                            break;
                        }
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
                        } else {
                          imageURLs.push([
                            filename,
                            images[i]["amazonURL"],
                            imageStyle
                          ]);
                        }
                      }
                    }
                    res.render('pages/component-profile', {
                      csrfToken: req.csrfToken(),
                      user : req.user || {},
                      headshot : headshotURL,
                      headshotStyle : headshotStyle,
                      idea : idea._doc,
                      problemHeadshotURL : problemHeadshotURL,
                      component : component,
                      problem : problem,
                      variantDates : variantDates,
                      imageURLs : imageURLs,
                      components : components,
                      relatedComponents : relatedComponents
                      //components : components,
                      //listOfProblems : listOfProblems
                    });
                  });//end of image query

                // in case theres no images
                } else {
                      res.render('pages/component-profile', {
                        csrfToken: req.csrfToken(),
                        user : req.user || {},
                        headshot : headshotURL,
                        headshotStyle : headshotStyle,
                        problemHeadshotURL : problemHeadshotURL,
                        idea : idea._doc,
                        components : components,
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

                // add main component image to list of id's to be retrieved
                if(component.mainImage){
                  imageIDs.unshift(component.mainImage);
                }

                IdeaImage.find({"_id" : {$in : imageIDs}}, function(err, images){
                  var imageURLs = [];
                  for(var i = 0; i < images.length; i++){
                    var imageStyle = "";
                    switch (images[i]["orientation"]) {
                      case 1 :
                        imageStyle = "";
                        break;
                      case 2 :
                        imageStyle = "-webkit-transform: rotate(90deg);-moz-transform: rotate(90deg);-o-transform: rotate(90deg);-ms-transform: rotate(90deg);transform: rotate(90deg);";
                        break;
                      case 3 :
                        imageStyle = "-webkit-transform: rotate(180deg);-moz-transform: rotate(180deg);-o-transform: rotate(180deg);-ms-transform: rotate(180deg);transform: rotate(180deg);";
                        break;
                      case 4 :
                        imageStyle = "-webkit-transform: rotate(270deg);-moz-transform: rotate(270deg);-o-transform: rotate(270deg);-ms-transform: rotate(270deg);transform: rotate(270deg);";
                        break;
                    }
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
                  res.render('pages/component-profile', {
                    csrfToken: req.csrfToken(),
                    user : req.user || {},
                    headshot : headshotURL,
                    headshotStyle : headshotStyle,
                    idea : idea._doc,
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
                    res.render('pages/component-profile', {
                      csrfToken: req.csrfToken(),
                      user : req.user || {},
                      headshot : headshotURL,
                      headshotStyle : headshotStyle,
                      idea : idea._doc,
                      components : components,
                      component : component,
                      variantDates : variantDates,
                      problem : "none",
                      relatedComponents : relatedComponents,
                      imageURLs : []
                    });
              }
          }
        }); // end of other component query
      });

    });// end of component query
  });
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

        // add other component to this component
        if(thisComponent.relatedComps.length > 0){
          thisComponent.relatedComps.push({
            "compID" : otherComponent['id'],
            "relationship"  : relatedCompDescription
          });
        } else {
          thisComponent.relatedComps = {
            "compID" : otherComponent['id'],
            "relationship"  : relatedCompDescription
          };
        }

        // add other component to this component
        if(otherComponent.relatedComps.length > 0){
          otherComponent.relatedComps.push({
            "compID" : thisComponent['id'],
            "relationship"  : relatedCompDescription
          });
        } else {
          otherComponent.relatedComps = {
            "compID" : thisComponent['id'],
            "relationship"  : relatedCompDescription
          };
        }

        thisComponent.save(function(err){
          otherComponent.save(function(err){
            console.log('new related component added');
            res.redirect('/component-profile/'+compIdentifier);
          });
        });

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
module.exports = router;
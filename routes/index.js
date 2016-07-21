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
* Route for the root path
******************************************************************
******************************************************************
*****************************************************************/
router.get('/', function (req, res) {
    if(req.user){
      res.redirect('/profile/' + req.user.username);
    } else {
      res.render('index', { user : req.user });
    }
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for getting the register page
******************************************************************
******************************************************************
*****************************************************************/
router.get('/register', function(req, res) {
    res.render('pages/register', { });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for registering new user
******************************************************************
******************************************************************
*****************************************************************/
router.post('/register', function(req, res) {
    Account.register(new Account({ username : req.body.username,
      einsteinPoints: 0, rupees: 0, ideaSeeds: [] }), req.body.password, function(err, account) {
        if (err) {
            console.log("err.message:" + err.message);
            return res.render('pages/register', { account : account, message : err.message });
        }

        passport.authenticate('local')(req, res, function () {
            res.redirect('/');
        });
    });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for getting the login page for existing accounts
******************************************************************
******************************************************************
*****************************************************************/
router.get('/login', function(req, res) {
    res.render('pages/login', { user : req.user });
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for getting the personal profile page
******************************************************************
******************************************************************
*****************************************************************/
router.get('/profile/:username', function(req, res) {
    if(req.user){
      if (req.session.idea){
        req.session.idea = null;
      }

      /* For now, we're trusting the username is unique */
      Account.findOne({"username" : req.params.username}, function(err, account){
        
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
            IdeaImage.findById(account.headshots[0], function(err, headshot){
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
              if(account.ideaSeeds && account.ideaSeeds.length > 0){
                var ideaNames = [],
                    j = 0;
                    IdeaReview.find({"reviewer" : account.username}, function(err, reviews){
                      var ideaSeedIDs = _.map(reviews, function(item){return item["ideaSeedId"];});
                      

                      console.log('reviewIDs' + ideaSeedIDs.toString());
                      

                      ideaSeedIDs = _.filter(ideaSeedIDs, Boolean);
                      IdeaSeed.find({_id : {$in : ideaSeedIDs}}, function(err, reviewedIdeas){
                        var reviewedIdeaNames = _.map(reviewedIdeas, function(item){return item["name"];});


                        console.log('reviewIDs' + reviewedIdeaNames.toString());
                        

                        var context = {"reviewedNames" : reviewedIdeaNames};
                        _.each(account.ideaSeeds, function(element, index,  list){
                          reviewNames = this["reviewedNames"];
                          (function(reviewNames){
                          IdeaSeed.findById(element._id, function(error, document){
                            j++;
                            if(document){
                              ideaNames.push(document.name);
                              if(j == account.ideaSeeds.length){
                                return res.render('pages/profile', {
                                  reviewNames : reviewNames,
                                  headshot : headshotURL,
                                  headshotStyle : headshotStyle,
                                  user : req.user,
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
                                return res.render('pages/profile', {
                                  reviewNames : reviewNames,
                                  myAptitudes : myAptitudes,
                                  headshot : headshotURL,
                                  headshotStyle : headshotStyle,
                                  schoolNetwork : schoolNetwork,
                                  locationNetwork : locationNetwork,
                                  companyNetwork : companyNetwork,
                                  user : req.user,
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
                return res.render('pages/profile', {
                  user : req.user,
                  profileAccount: account,
                  aptitudes : myAptitudes,
                  headshot : headshotURL,
                  headshotStyle : headshotStyle,
                  schoolNetwork : schoolNetwork,
                  locationNetwork : locationNetwork,
                  companyNetwork : companyNetwork,
                  accountIdeaSeeds : []
                });
              }
            });
          }); //end of the aptitude query
        }); // End of Network query
      }); // End of Account query


    } else {
      res.redirect('/');
    }
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for getting the profile picture, to put in the header bar
* for example
******************************************************************
******************************************************************
*****************************************************************/
router.get('/profile-picture', function(req, res){
  if(req.user){

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


      var headshotIDs = _.map(req.user.headshots, function(image){
        return image.toString();
      })

      IdeaImage.find({"_id" : { $in : headshotIDs}}, function(err, images){

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

          res.render('pages/profile-picture', {
            user : req.user,
            imageURLs : imageURLs,
            headshotStyle : headshotStyle,
            headshot : headshotURL,
            profilePictureFilename : profilePictureFilename
          });
        } else {
          res.render('pages/profile-picture', {
            user : req.user,
            headshot : headshotURL,
            headshotStyle : headshotStyle,
            imageURLs : [],
            profilePictureFilename : ""
          });
        }
      });
    });
  } else {
    res.redirect('/');
  }
});



/*****************************************************************
******************************************************************
******************************************************************
* Route for viewing all the ideas in the system
******************************************************************
******************************************************************
*****************************************************************/
router.get('/view-all-ideas', function(req, res){
  //workaround for a second
  //if(req){ res.redirect('/begin');} else{
  if(req.user){
  // IdeaSeed.find({"visibility" : "public"}, function(err, ideas){
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
    } else {
      var headshotURL = "";
    }

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

                  res.render('pages/view-all-ideas', {
                    user : req.user,
                    headshot : headshotURL,
                    headshotStyle : headshotStyle,
                    ideas : ideaList
                  });
                } else {
                  res.render('pages/view-all-ideas', {
                    user : req.user,
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
  } else {
    res.redirect('/');
  }
//}//end of workaround
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
router.get('/introduce-idea', function(req, res) {
    if(req.user){
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
          res.render('pages/introduce-idea', { user : req.user, idea : req.session.idea });
        } else {
          IdeaSeed.findById(req.session.idea,function(err, idea){
            currentIdea = idea._doc;
            res.render('pages/introduce-idea', { user : req.user,
              headshot : headshotURL,
              headshotStyle : headshotStyle,
              idea : currentIdea });
          });
        }
      });
    } else {
      res.redirect('/');
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
router.post('/introduce-idea', function(req, res) {
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
router.get('/accomplish', function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
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

    IdeaSeed.findById(req.session.idea,function(err, idea){
      currentIdea = idea._doc;
      res.render('pages/accomplish', { user : req.user,
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
router.post('/accomplish', function(req, res) {
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
router.post('/suggestion-submit', function(req, res) {
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

/*****************************************************************
******************************************************************
******************************************************************
* Route for updating the points in the suggestion table on the fly
* when a user saves a new suggestion.
******************************************************************
******************************************************************
*****************************************************************/
router.get('/update-suggestion-points/:problemAuthor', function(req, res){
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
* I have to look up where this is used.
******************************************************************
******************************************************************
*****************************************************************/
router.get('/update-suggestion-list/:problem', function(req, res){
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
router.post('/save-idea-name', function(req, res) {
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
      res.redirect('/idea-summary/' + idea.name);
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
router.get('/update-viability-scores', function(req, res) {
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
      IdeaReview.findOne({"_id" : req.session.ideaReview}, function(error, currentReview){
        if(error){
          console.error('ERROR! ' + error);
          res.json({});
        } else {
          res.json(currentReview._doc);
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
router.post('/update-all-viabilities', function(req, res) {
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
      IdeaReview.findOne({"_id" : req.session.ideaReview}, function(error, currentReview){
        if(error){
          console.error('ERROR! ' + error);
          res.json({});
        } else {
          _.each(req.body, function(value, key){
            currentReview[key] = value;
          });

          currentReview.save(function (err, idea, numaffected) {
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
router.get('/image-upload', function(req, res){
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
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
                user : req.user,
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

        res.render('pages/image-upload', { user : req.user,
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
router.post('/image-upload', function(req, res) {

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
          IdeaSeed.update(
              { _id : req.session.idea },
              { $push : { images : newImage.id }},
              function(err, raw){
                console.log('The raw response from Mongo was ', raw);
                res.json({"redirectURL" : '/annotate-image/'+newFileName});
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

/*****************************************************************
******************************************************************
******************************************************************
* Route for rendering the suggestion point table
******************************************************************
******************************************************************
*****************************************************************/
router.get('/suggestion-summary', function(req, res){
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
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


            res.render('pages/suggestion-summary', { user : req.user, idea : currentIdea,
              problems : sortedProblems, categoryPoints : categoryPointValues,
              headshot : headshotURL,
              headshotStyle : headshotStyle,
              firstProblemText : firstProblemText, reviewing : reviewing
            });
          });
        } else {
          if(req.session.ideaReview){ var reviewing = true; }
          else { var reviewing = false; }
          res.render('pages/suggestion-summary', { user : req.user, idea : currentIdea,
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
router.get('/view-idea-suggestions', function(req, res){
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
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
                user : req.user, //user document
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
router.get('/sort-problems', function(req, res){
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
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


        res.render('pages/sort-problems', { user : req.user, idea : idea._doc,
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
router.post('/order-problems', function(req, res) {
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
router.post('/incorporate-suggestions', function(req, res) {
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

    Component.find({"images.imageID" : {$in : incorporatedImages}}, function(err, components){

      for(var k = 0; k < components.length; k++){
        if(incorporatedSuggestions.indexOf(components[k]['id']) == -1){
          incorporatedSuggestions.push(components[k]['id']);
        }
      }

      newVariant["components"] = incorporatedSuggestions;
      newVariant["images"] = incorporatedImages;

      currentIdea.variants.push(newVariant);
      idea.save(function(data){
        res.redirect('/idea-summary/' + idea.name);
      });
    });
  });
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for logging in using the passport library
******************************************************************
******************************************************************
*****************************************************************/
router.post('/login', passport.authenticate('local'), function(req,res){
    res.redirect('/profile/' + req.user.username);
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for getting the contributor summary page, that sets the
* session info and redirects to /contributor-idea-summary
* so the idea isn't in the URL
******************************************************************
******************************************************************
*****************************************************************/
router.get('/contributor-idea-summary/:ideaName', function(req, res){
  IdeaSeed.findOne({ "name" : req.params.ideaName },function(err, idea){
    
    if(err || !idea){
      res.redirect('/');
      return;
    }

    // store this idea in the session
    req.session.idea = idea.id;

    // If the visitor is the owner of the idea, route to the inventor
    // idea summary view
    if(idea.inventorName == req.user.username){
      delete req.session.ideaReview;
      res.redirect('/idea-summary/'+req.params.ideaName);


    } else {
      if(!req.session.idea){
        res.redirect('/');
        return;
      }
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
        IdeaSeed.findById(req.session.idea,function(err, idea){
          var imageURLs = [];
          currentIdea = idea._doc;
          var currentlyReviewing = false;
          Component.find({"ideaSeed" : idea.id}, function(err, components){
            if(idea.ideaReviews.length > 0){
              var reviewsChecked = 0;
                IdeaReview.find({"_id" : {$in : idea.ideaReviews } }, function(err, reviews){
                  var k = 0;
                  var currentReview = {};
                  while(k < reviews.length && !currentlyReviewing) {
                    if(reviews[k] && reviews[k].reviewer == req.user.username){
                      currentlyReviewing = true;
                      currentReview = reviews[k];
                      req.session.ideaReview = reviews[k].id;
                    }
                    if(reviewsChecked >= (reviews.length - 1) || currentlyReviewing){
                      if (idea.images.length > 0){
                          IdeaImage.find({"_id" : {$in : idea.images } } , function(err, images){
                            for(var j = 0; j < images.length; j++){
                              if(images[j] && images[j].amazonURL){
                                var filename = images[j]["filename"];
                                var imageStyle = "";
                                switch (images[j]["orientation"]) {
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
                                  images[j]["amazonURL"],
                                  imageStyle
                                ]);
                              }
                            } // end of loop of images
                            res.render('pages/contributor-idea-summary', {
                              user : req.user, idea : currentIdea,
                              currentReview : currentReview,
                              headshot : headshotURL,
                              headshotStyle : headshotStyle,
                              imageURLs : imageURLs,
                              components : components,
                              currentlyReviewing : currentlyReviewing
                            });
                          }); //end of images query
                      } else {
                        res.render('pages/contributor-idea-summary', {
                          user : req.user, idea : currentIdea,
                          currentReview : currentReview,
                          headshot : headshotURL,
                          headshotStyle : headshotStyle,
                          imageURLs : [],
                          components : components,
                          currentlyReviewing : currentlyReviewing
                        });
                        return;
                      }
                    }
                    k++;
                    reviewsChecked++;
                  }
                }); //end of review query
            } else {
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
                            imageStyle
                          ]);
                        }
                        if (j == idea._doc.images.length){
                          res.render('pages/contributor-idea-summary', {
                            user : req.user, idea : currentIdea,
                            imageURLs : imageURLs,
                            headshot : headshotURL,
                            headshotStyle :  headshotStyle,
                            components : components,
                            currentReview : {},
                            currentlyReviewing : currentlyReviewing
                          });
                        }
                      });
                    }
                  } else {
                    res.render('pages/contributor-idea-summary', {
                      user : req.user, idea : currentIdea,
                      imageURLs : [],
                      headshot : headshotURL,
                      headshotStyle : headshotStyle,
                      components : components,
                      currentReview : {},
                      currentlyReviewing : currentlyReviewing
                    });
                  }
            }
          });//end of component query
        });
      });
    }
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for rendering the contributor idea summary page
******************************************************************
******************************************************************
*****************************************************************/
router.get('/contributor-idea-summary', function(req, res){
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for saving session info for an idea seed, then redirecting
* to the /idea-summary pathname
******************************************************************
******************************************************************
*****************************************************************/
router.get('/idea-summary/:ideaName', function(req, res){
  
  // potentially fragile logic here. all ideas should have
  // a name after the initial visit to this path. but on the first 
  // visit, we'll rely on the session to grab the idea id that was
  // created on the introductory ideaseed creation pages, coming
  // from the image upload page
  
  IdeaSeed.findOne({ $or : [
    {"_id" : req.session.idea},
    {"name" : req.params.ideaName}
    ]},
    function(err, idea){

    if(err || !idea){
      res.redirect('/');
      return;
    } 


    // If the visitor is the owner of the idea, route to the inventor
    // idea summary view
    if(idea.inventorName != req.user.username){
      res.redirect('/contributor-idea-summary/'+req.params.ideaName);
    } else {
      req.session.idea = idea.id;

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

        delete req.session.ideaReview;


        IdeaSeed.findById(req.session.idea,function(err, idea){
          currentIdea = idea._doc;

          IdeaProblem.find({"ideaSeed" : currentIdea._id, date : {$exists : true}}, null,
            {sort: '-date'}, function(err, problems){
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
              if(idea.inventorName != req.user.username){
                res.redirect('/contributor-idea-summary');
                return;
              }
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
                      res.render('pages/idea-summary', { user : req.user, idea : currentIdea,
                        variantDates : variantDates,
                        problemAreas  : problemAreas,
                        headshot : headshotURL,
                        headshotStyle : headshotStyle,
                        imageURLs : imageURLs,
                        problems : problems,
                        components : components,
                        listOfProblems : listOfProblems });
                    }
                  });
                }
              } else {
                      res.render('pages/idea-summary', { user : req.user, idea : currentIdea,
                        variantDates : variantDates,
                        problemAreas  : problemAreas,
                        imageURLs : [],
                        headshot : headshotURL,
                        headshotStyle : headshotStyle,
                        problems : problems,
                        components : components,
                        listOfProblems : listOfProblems });
              }
            }); //end of components query
          }); // end of idea problems query
        });
      });
    

    }
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for rendering the idea profile page
******************************************************************
******************************************************************
*****************************************************************/
router.get('/idea-summary', function(req, res){
});


/*****************************************************************
******************************************************************
******************************************************************
* Gets called when the user clicks the button to create a new
* application
******************************************************************
******************************************************************
*****************************************************************/
router.get('/create-application', function(req, res){
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
router.get('/variant/:variantname', function(req, res){
  if(!req.session.idea){
    res.redirect('/');
    return;
  }

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
          res.redirect('/idea-summary/' + currentIdea['name']);
          return;
        }

        var suggestionsList = []; //build components by category
        var imagesAndComponents = {}; //build list of components within each imageID key
        //not sure about components with no image or category yet
        var currentImageID;
        var headshotNames = [];


        for(var i = 0; i < components.length; i++){
          //break into two lists, one for components with no images, and on for those with
          if(components[i].images.length == 0){
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

                currentIdea = idea._doc;

                res.render('pages/variant', { user : req.user, idea : currentIdea,
                  suggestionsList : suggestionsList,
                  images : imageList,
                  variantSummary : true,
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
router.get('/annotate-image/:image', function(req, res){
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
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
                user : req.user,
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
router.get('/get-last-component-description', function(req, res){
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
router.get('/image-modal/:image', function(req, res){
  if(!req.session.idea){
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
router.post('/save-component', function(req, res) {
  IdeaImage.findOne({"filename" : req.body.imageName}, function(err, image){

    if(err){
      res.json({error: err});
    }

    req.body.component = req.body.component.slice(16); //get rid of "the solution of "

    if(req.body.component.charAt(req.body.component.length-1) == "."){
      req.body.component = req.body.component.slice(-1);
    }

    Component.findOne({"text" : req.body.component}, function(err, component){
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
router.post('/edit-component', function(req, res) {
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
router.get('/view-all-viabilities', function(req, res) {
  res.render('partials/viability-overview-modal',
    { user : req.user, headshot : headshotURL, idea : req.session.idea }
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
router.post('/delete-image-component', function(req, res) {
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
router.get('/logout', function(req, res) {
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
router.get('/clear-session-idea', function(req, res){
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
router.get('/begin-contributor-review', function(req, res){
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
              res.redirect('/contributor-idea-summary/' + idea.name);
            }
        );
      }
    });
  }
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for component profile
******************************************************************
******************************************************************
*****************************************************************/
router.get('/component-profile/:identifier', function(req, res){
  if(!req.session.idea){
    res.redirect('/');
    return;
  }

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
                      user : req.user,
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
                        user : req.user,
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
                    user : req.user,
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
                      user : req.user,
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
router.post('/add-related-component', function(req, res) {
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

router.get('/sign-s3', function(req, res) {
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
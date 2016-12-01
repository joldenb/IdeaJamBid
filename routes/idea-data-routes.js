var express = require('express');
var passport = require('passport');
var mongoose = require('mongoose');
var _ = require('underscore');
var IdeaSeed = require('../models/ideaSeed');
var Component = require('../models/component');
var IdeaImage = require('../models/ideaImage');
var IdeaReview = require('../models/ideaReviews');
var IdeaProblem = require('../models/ideaProblem');
var Aptitude = require('../models/aptitude');
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
router.get('/ideas/:ideaName/edit/criticisms', csrfProtection, function(req, res) {
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



////////////////////////////////////////////////
// Add a problem to an idea seed
////////////////////////////////////////////////
router.get('/ideas/:ideaName/edit/evaluation', csrfProtection, function(req, res) {

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

    res.render('pages/ideas/idea-seed-evaluation', { user : req.user || {}, idea : currentIdea,
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



////////////////////////////////////////////////
// Add a problem to an idea seed
////////////////////////////////////////////////
router.get('/ideas/:ideaName/edit/component-details', csrfProtection, function(req, res) {

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

    res.render('pages/ideas/idea-seed-component-details', { user : req.user || {}, idea : currentIdea,
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







////////////////////////////////////////////////
// Add a problem to an idea seed
////////////////////////////////////////////////
router.get('/ideas/:ideaName/edit/images', csrfProtection, function(req, res) {

  if(!(req.user && req.user.username)) {
    console.log("not logged in");
    res.redirect('/');
    return;
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
  var ideaAptitudes;
  var imageURLs = [];
  var thisIdea;

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
    thisIdea = idea;        
    return IdeaImage.find({"_id" : {$in : idea.images}}).exec()
  })
  .then( function(imageDocuments){
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

    imageURLs = imageURLs.reverse();

    res.render('pages/ideas/image-upload', {
      csrfToken: req.csrfToken(),
      user : req.user || {},
      headshot: headshotURL,
      headshotStyle : headshotStyle,
      idea : thisIdea,
      imageURLs : imageURLs
    });

  })
  .catch(function(err){
    // just need one of these
    req.session.loginPath = null;
    console.log('error:', err);
    res.redirect('/');
  });

});



////////////////////////////////////////////////
// Add a problem to an idea seed
////////////////////////////////////////////////
router.get('/ideas/:ideaName/edit/aptitudes', csrfProtection, function(req, res) {

  if(!(req.user && req.user.username)) {
    console.log("not logged in");
    res.redirect('/');
    return;
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
    if(!((currentIdea.inventorName == req.user.username) ||
      (currentIdea.collaborators.indexOf(req.user.username) > -1))){
      console.log("visibility mode does not permit this user to view this idea");
      throw new Error('abort promise chain');
      
    }

    return Aptitude.find({"_id" : {$in : currentIdea.aptitudes}})
  })
  .then(function(myAptitudes){

    ideaAptitudes = myAptitudes;

    res.render('pages/ideas/idea-seed-aptitudes', { user : req.user || {}, idea : currentIdea,
      review : req.session.ideaReview || {},
      csrfToken: req.csrfToken(),
      aptitudes : ideaAptitudes,
      headshot : headshotURL,
      headshotStyle : headshotStyle,
      inventorName : currentIdea.inventorName
    });
  
  })
  .catch(function(err){
    // just need one of these
    req.session.loginPath = null;
    console.log('error:', err);
    res.redirect('/');
  });

});


////////////////////////////////////////////////
// Add a problem to an idea seed
////////////////////////////////////////////////
router.get('/ideas/:ideaName/edit/components', csrfProtection, function(req, res) {

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
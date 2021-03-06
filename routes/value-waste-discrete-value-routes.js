var express = require('express');
var passport = require('passport');
var mongoose = require('mongoose');
var _ = require('underscore');
var IdeaSeed = require('../models/ideaSeed');
var IdeaImage = require('../models/ideaImage');
var IdeaProblem = require('../models/ideaProblem');
var IdeaReview = require('../models/ideaReviews');
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

                  
var viabilities = [
    {
      name: "performability",
      prefix: "perf",
      low: "Incapable",
      high: "Effective",
      reviewScore : "performOne",
      reviewProb : "Area : Performability"

    }, 
    {
      name: "affordability",
      prefix: "afford",
      low: "Expensive",
      high: "Economical",
      reviewScore : "affordOne",
      reviewProb : "Area : Affordability"
    }, 
    {
      name: "featurability",
      prefix: "feature",
      iconId: "perfIcon",
      low : "Bland",
      high : "Multifaceted",
      reviewScore : "featureOne",
      reviewProb : "Area : Featurability"
    },
    {
      name: "deliverability",
      prefix: "deliver",
      iconId: "deliverabilityIcon",
      low: "Unaccessible",
      high: "Available",
      reviewScore : "deliverOne",
      reviewProb : "Area : Deliverability"
    },
    {
      name: "useability",
      prefix: "useability",
      low: "Impractical",
      high: "Pragmatic",
      reviewScore : "useabilityOne",
      reviewProb : "Area : Useability"
    }, 
    {
      name: "maintainability",
      prefix: "maintain",
      iconId: "maintainabilityIcon",
      low: "Untenable",
      high: "Sustainable",
      reviewScore : "maintainOne",
      reviewProb : "Area : Maintainability"
    }, 
    {
      name: "danger",
      link: "dangerous",
      prefix: "danger",
      low : "Harmless",
      high : "Hazardous",
      reviewScore : "dangerOne",
      reviewProb : "Area : Danger"
    }, 
    {
      name: "durability",
      prefix: "durability",
      low: "Unreliable",
      high: "Enduring",
      reviewScore : "durabilityOne",
      reviewProb : "Area : Durability"
    }, 
    {
      name: "imageability",
      prefix: "imageability",
      sliderId: "imageSlider",
      low: "Undesirable",
      high: "Appealing",
      reviewScore : "imageOne",
      reviewProb : "Area : Imageability"
    }, 
    {
      name: "complexity",
      prefix: "complexity",
      sliderId: "complexSlider",
      low: "Simple",
      high: "Complicated",
      reviewScore : "complexOne",
      reviewProb : "Area : Complexity"
    }, 
    {
      name: "precision",
      prefix: "precision",
      low: "Lenient",
      high: "Fussy",
      reviewScore : "precisionOne",
      reviewProb : "Area : Precision"
    }, 
    {
      name: "variability",
      prefix: "variability",
      low: "Consistent",
      high: "Dynamic",
      reviewScore : "variabilityOne",
      reviewProb : "Area : Variability"
    }, 
    {
      name: "sensitivity",
      prefix: "sensitivity",
      low: "Reliable",
      high: "Fragile",
      reviewScore : "sensitivityOne",
      reviewProb : "Area : Sensitivity"
    }, 
    {
      name: "immaturity",
      prefix: "immaturity",
      sliderId: "immatureSlider",
      low: "Developed",
      high: "Raw",
      reviewScore : "immatureOne",
      reviewProb : "Area : Immaturity"
    }, 
    {
      name: "skills",
      prefix: "skills",
      low: "Easy",
      high: "Onerous",
      reviewScore : "skillsOne",
      reviewProb : "Area : Skills"
    }
  ];

var getViabilityIcon = function getViabilityIcon(problemArea){
  for (var via in viabilities) {
    if(viabilities[via]["reviewProb"]==problemArea && !viabilities[via]['iconId']) {
      return viabilities[via].prefix + "Icon";
    } else if(viabilities[via]["reviewProb"]==problemArea && viabilities[via]['iconId']){
      return viabilities[via]['iconId'];
    }
  }
};

var getMobileScorePage = function getMobileScorePage(req, res, problemArea, templateRoute){
  if(!req.session.idea){
    res.redirect('/');
    return;
  }

  if(!req.session.viabilities){
    res.redirect('/view-all-viabilities');
    return;
  }

  //get the link name, get rid of "-score" at the end
  var linkName = templateRoute.split("/")[2].substring(0, templateRoute.split("/")[2].length - 6);
  var nextLink, nextButtonText, bailButtonText;
  _.each(req.session.viabilities, function(eachOne, index){
    if(eachOne.link == linkName && req.session.viabilities[index + 1] && index % 4 != 3){
      nextLink = "/" + req.session.viabilities[index + 1].link + "-score";
      nextButtonText = "Continue";
      bailButtonText = "View All"
    } else if (eachOne.link == linkName) {
      nextLink = "/ideas/";
      nextButtonText = "Done!";
      bailButtonText = "Enter More";
    }
  });

  var viabilityIcon = getViabilityIcon(problemArea);
  IdeaSeed.findById(req.session.idea,function(err, idea){
    IdeaProblem.find({"ideaSeed" : idea.id, "creator" : req.user.username, problemArea : problemArea}, function(err, problems){
      IdeaReview.find({"reviewer" : req.user.username, "ideaSeedId" : idea.id}, function(err, currentReview){
        //if there is a review already for this user and idea
        if(currentReview.length > 0){
          req.session.ideaReview = currentReview[0];
          res.render(templateRoute, {
            csrfToken: req.csrfToken(),
            user : req.user || {},
            idea : idea,
            nextLink : nextLink,
            nextButtonText : nextButtonText,
            bailButtonText : bailButtonText,
            problems : problems,
            viabilityIcon : viabilityIcon,
            currentReview :  currentReview[0]
          });
        // if no review by this user for this idea
        } else {
          res.redirect('/view-all-viabilities');
          return;
        }
      });//end of review query
    });  //end of the problem query
  });
};

var getMobileProblemPage = function getMobileProblemPage(req, res, problemArea, templateRoute){
  if(!req.session.idea){
    res.redirect('/view-all-ideas');
    return;
  }

  if(!req.session.viabilities){
    res.redirect('/view-all-viabilities');
    return;
  }

  //get the link name, get rid of "-score" at the end
  var linkName = templateRoute.split("/")[2].substring(0, templateRoute.split("/")[2].length - 8);
  var nextLink;
  _.each(req.session.viabilities, function(eachOne, index){
    if(eachOne.link == linkName && req.session.viabilities[index + 1]){
      nextLink = "/" + req.session.viabilities[index + 1].link + "-score";
    } else if (eachOne.link == linkName) {
      nextLink = "/view-all-viabilities";
    }
  });

  var viabilityIcon = getViabilityIcon(problemArea);
  IdeaSeed.findById(req.session.idea,function(err, idea){
    IdeaProblem.find({"ideaSeed" : idea.id, problemArea : problemArea}, function(err, problems){
      var currentReviewerProblem;
      problems = _.filter(problems, function(problem){
        return  problem.text || problem.text != "";
      });
      _.each(problems, function(problem, index){
        if(problem.creator == req.user.username){
          currentReviewerProblem = problem;
        }
      });

      IdeaReview.find({"reviewer" : req.user.username, "ideaSeedId" : idea.id}, function(err, currentReview){
        //if there is a review already for this user and idea
        if(currentReview.length > 0){
          req.session.ideaReview = currentReview[0];
          res.render(templateRoute, {
            csrfToken: req.csrfToken(),
            user : req.user || {},
            idea : idea,
            nextLink : nextLink,
            problems : problems,
            viabilityIcon : viabilityIcon,
            currentReviewerProblem : currentReviewerProblem,
            currentReview :  currentReview[0]
          });
        // if no review by this user for this idea
        } else {
          res.redirect('/view-all-viabilities');
          return;
        }
      });//end of review query
    });  //end of the problem query
  });
};

var postViabilityFormInfo = function postViabilityFormInfo(req,res, sliderValue, reviewScore, reviewProblem, newProblemArea){
  if(!(req.user && req.user.username && req.session.ideaReview)) {
    res.redirect('/');
    return;
  }

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
    

    // this is if the inventor is the same as the session user
    // enters info into the ideaSeed model vs the ideaReview model
    if(thisIdea.inventorName == req.user.username){
      if(req.body.affordSliderOneValue){
        thisIdea.affordOne = req.body.affordSliderOneValue;
      }
      if(req.body.affordProblem){
        req.body.affordProblem = req.body.affordProblem.slice(15);
        if(req.body.affordProblem.charAt(req.body.affordProblem.length-1) == "."){
          req.body.affordProblem = req.body.affordProblem.slice(0,-1);
        }
        var newProblem = {
          text          : req.body.affordProblem, //get rid of "the problem of ""
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Affordability",
          ideaSeed      : thisIdea.id,
          identifier    : "prob-"+Date.now()
        };

        IdeaProblem.create( newProblem ,
          function (err, problem) {
            if (err) return handleError(err);
            thisIdea.problemPriorities.unshift(problem.id);
            thisIdea.save(function (err, raw) {
                console.log('This raw response from Mongo was ', raw);
            });
          }
        );
      } else {
        thisIdea.save(function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      }
      Account.findById( req.user.id,
        function (err, account) {
          if(req.body.affordSliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.affordProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
              res.redirect('/view-all-viabilities');
          });
      });
    } else {
      if(!req.body[sliderValue] && !req.body[reviewProblem]){

        if(req.body.nextLink == '/ideas/'){
          res.redirect("/ideas/"+ thisIdea.name);
          return;
        } else {
          res.redirect(req.body.nextLink);
          return;
        }

      }

      // if there's a slider value
      if(req.body[sliderValue]){
        IdeaReview.findOne({_id : req.session.ideaReview._id}, function(err, review){
          review[reviewScore] = req.body[sliderValue];
          review.save(function(err, raw){
            // if the persons done entering scores, route them to the idea page and get out of the viability score pages
            if(req.body.nextLink == "/ideas/"){
              res.redirect("/ideas/"+ thisIdea.name);
              return;
            } else {
              res.redirect(req.body.nextLink);
            }
          });
        });
      }

      // if theres a problem entered
      if(req.body[reviewProblem]){
        req.body[reviewProblem] = req.body[reviewProblem].trim();
        
        req.body[reviewProblem] = req.body[reviewProblem].slice(15);
        if(req.body[reviewProblem].charAt(req.body[reviewProblem].length-1) == "."){
          req.body[reviewProblem] = req.body[reviewProblem].slice(0,-1);
        }
        IdeaProblem.find({"creator" : req.user.username, "ideaSeed" : thisIdea.id,
          "problemArea" : newProblemArea}, function(err, problems){
          if(problems.length > 0){
            problems[0].text = req.body[reviewProblem];
            problems[0].save(function (err, raw) {
              // if the persons done entering scores, route them to the idea page and get out of the viability score pages
              if(req.body.nextLink == "/ideas/"){
                res.redirect("/ideas/"+ thisIdea.name);
                return;
              } else {
                res.redirect(req.body.nextLink);
              }
            });
          } else {
            var newProblem = {
              text          : req.body[reviewProblem],
              creator       : req.user.username, date : new Date(),
              problemArea   : newProblemArea,
              ideaSeed      : thisIdea.id,
              identifier    : "prob-"+Date.now()
            };
            IdeaProblem.create( newProblem ,
              function (err, problem) {
                if (err) return handleError(err);
                thisIdea.save(function (err, raw) {
                  // if the persons done entering scores, route them to the idea page and get out of the viability score pages
                  if(req.body.nextLink == "/ideas/"){
                    res.redirect("/ideas/"+ thisIdea.name);
                    return;
                  } else {
                    res.redirect(req.body.nextLink);
                  }
                });
              
            }); //end of problem create
          } // end of else clause creating a new problem
        }); //end of trying to find an existing problem
      }
    }
  });

}

////////////////////////////////////////////////
// Waste Value Summary
////////////////////////////////////////////////
router.get('/view-all-viabilities', csrfProtection, function(req, res) {

  if(!req.session.idea){
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
  };

  req.session.viabilities = viabilities;

  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];
    IdeaSeed.findById(req.session.idea,function(err, idea){
      if(!idea){
        res.redirect("/view-all-ideas");
        return;
      }
      IdeaProblem.find({"ideaSeed" : idea.id, "creator" : req.user.username}, function(err, problems){
        var problemObject = {};
        _.each(problems, function(problem, index){
          if(problem.identifier && problem.text){
            problemObject[problem.problemArea] = {'text' : problem.text, 'identifier' : problem.identifier};
          }
        });

        IdeaReview.find({"reviewer" : req.user.username, "ideaSeedId" : idea.id}, function(err, currentReview){
          //if there is a review already for this user and idea
          if(currentReview.length > 0){
            var averageScore = 0;

            averageScore = Math.round(IdeaReview.averageViabilityScores([currentReview[0]]));

            req.session.ideaReview = currentReview[0];
            res.render('pages/view-all-viabilities', {
              csrfToken: req.csrfToken(),
              user : req.user || {},
              idea : idea,
              headshot : headshotURL,
              viabilities : viabilities,
              averageScore : averageScore,
              problems : problemObject,
              currentReview :  currentReview[0],
              headshotURL : headshotURL,
              headshotStyle : headshotStyle
            });
          // if no review by this user for this idea
          } else {
            var newReview = {
              ideaSeedId : req.session.idea,
              reviewer : req.user.username
            };
            IdeaReview.create(newReview, function(err, newReview){
              if(err) { console.log("new review not created correctly")}
              idea.ideaReviews.push(newReview.id);
              idea.save(function(err, updatedIdea){
                req.session.ideaReview = newReview;
                res.render('pages/view-all-viabilities', {
                  csrfToken: req.csrfToken(),
                  user : req.user || {},
                  idea : idea,
                  headshot : headshotURL,
                  averageScore : 0,
                  viabilities : viabilities,
                  problems : problemObject,
                  currentReview :  currentReview,
                  headshotURL : headshotURL,
                  headshotStyle : headshotStyle
                });
              });
            });
          }
        });//end of review query
      });  //end of the problem query
    });
});

////////////////////////////////////////////////
// Overall Single Score Page
////////////////////////////////////////////////
router.get('/view-single-overall-score', csrfProtection, function(req, res) {

  if(!req.session.idea){
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
  };

  req.session.viabilities = viabilities;

  var headshotData = ideaSeedHelpers.getUserHeadshot(req);
  var headshotURL = headshotData['headshotURL'];
  var headshotStyle = headshotData['headshotStyle'];
    IdeaSeed.findById(req.session.idea,function(err, idea){
      if(!idea){
        res.redirect("/view-all-ideas");
        return;
      }
      IdeaProblem.find({"ideaSeed" : idea.id, "creator" : req.user.username}, function(err, problems){
        var problemObject = {};
        _.each(problems, function(problem, index){
          if(problem.identifier && problem.text){
            problemObject[problem.problemArea] = {'text' : problem.text, 'identifier' : problem.identifier};
          }
        });

        IdeaReview.find({"reviewer" : req.user.username, "ideaSeedId" : idea.id}, function(err, currentReview){
          //if there is a review already for this user and idea
          if(currentReview.length > 0){
            var averageScore = 0;

            averageScore = Math.round(IdeaReview.averageViabilityScores([currentReview[0]]));

            req.session.ideaReview = currentReview[0];
            res.render('pages/values-wastes-mobile/view-single-overall-score', {
              csrfToken: req.csrfToken(),
              user : req.user || {},
              idea : idea,
              headshot : headshotURL,
              viabilities : viabilities,
              averageScore : averageScore,
              problems : problemObject,
              currentReview :  currentReview[0],
              headshotURL : headshotURL,
              headshotStyle : headshotStyle
            });
          // if no review by this user for this idea
          } else {
            var newReview = {
              ideaSeedId : req.session.idea,
              reviewer : req.user.username
            };
            IdeaReview.create(newReview, function(err, newReview){
              if(err) { console.log("new review not created correctly")}
              idea.ideaReviews.push(newReview.id);
              idea.save(function(err, updatedIdea){
                req.session.ideaReview = newReview;
                res.render('pages/values-wastes-mobile/view-single-overall-score', {
                  csrfToken: req.csrfToken(),
                  user : req.user || {},
                  idea : idea,
                  headshot : headshotURL,
                  averageScore : 0,
                  viabilities : viabilities,
                  problems : problemObject,
                  currentReview :  currentReview,
                  headshotURL : headshotURL,
                  headshotStyle : headshotStyle
                });
              });
            });
          }
        });//end of review query
      });  //end of the problem query
    });
});


router.post("/save-all-viability-scores", csrfProtection, function(req, res){
  IdeaReview.findOne({"reviewer" : req.user.username, "ideaSeedId" : req.session.idea}, function(err, currentReview){
    //if there is a review already for this user and idea
    if(currentReview){
      currentReview.performOne = req.body.overallScore;
      currentReview.affordOne = req.body.overallScore;
      currentReview.featureOne = req.body.overallScore;
      currentReview.deliverOne = req.body.overallScore;
      currentReview.useabilityOne = req.body.overallScore;
      currentReview.maintainOne = req.body.overallScore;
      currentReview.durabilityOne = req.body.overallScore;
      currentReview.imageOne = req.body.overallScore;
      currentReview.complexOne = 100 - req.body.overallScore;
      currentReview.precisionOne = 100 - req.body.overallScore;
      currentReview.variabilityOne = 100 - req.body.overallScore;
      currentReview.sensitivityOne = 100 - req.body.overallScore;
      currentReview.immatureOne = 100 - req.body.overallScore;
      currentReview.dangerOne = 100 - req.body.overallScore;
      currentReview.skillsOne = 100 - req.body.overallScore;
      currentReview.save(function(err, results){
        res.sendStatus(200);
      });
    }
  });



});

////////////////////////////////////////////////
// Performability
////////////////////////////////////////////////

router.get('/performability-discrete-score', csrfProtection, function(req, res) {
  getMobileScorePage(req, res, "Area : Performability", 'pages/values-wastes-discrete-value/performability-discrete-score');
});

router.get('/performability-discrete-problem', csrfProtection, function(req, res) {
  getMobileProblemPage(req, res,"Area : Performability", 'pages/values-wastes-discrete-value/performability-discrete-problem');
});

////////////////////////////////////////////////
// Affordability
////////////////////////////////////////////////
router.get('/affordability-discrete-score', csrfProtection, function(req, res) {
  getMobileScorePage(req, res, "Area : Affordability", 'pages/values-wastes-discrete-value/affordability-discrete-score');
});

router.get('/affordability-discrete-problem', csrfProtection, function(req, res) {
  getMobileProblemPage(req, res,"Area : Affordability", 'pages/values-wastes-discrete-value/affordability-discrete-problem');
});

////////////////////////////////////////////////
// Featurability
////////////////////////////////////////////////
router.get('/featurability-discrete-score', csrfProtection, function(req, res) {
  getMobileScorePage(req, res, "Area : Featurability", 'pages/values-wastes-discrete-value/featurability-discrete-score');
});

router.get('/featurability-discrete-problem', csrfProtection, function(req, res) {
  getMobileProblemPage(req, res,"Area : Featurability", 'pages/values-wastes-discrete-value/featurability-discrete-problem');
});

////////////////////////////////////////////////
// Deliverability
////////////////////////////////////////////////
router.get('/deliverability-discrete-score', csrfProtection, function(req, res) {
  getMobileScorePage(req, res, "Area : Deliverability", 'pages/values-wastes-discrete-value/deliverability-discrete-score');
});

router.get('/deliverability-discrete-problem', csrfProtection, function(req, res) {
  getMobileProblemPage(req, res,"Area : Deliverability", 'pages/values-wastes-discrete-value/deliverability-discrete-problem');
});

////////////////////////////////////////////////
// Useability
////////////////////////////////////////////////
router.get('/useability-discrete-score', csrfProtection, function(req, res) {
  getMobileScorePage(req, res, "Area : Useability", 'pages/values-wastes-discrete-value/useability-discrete-score');
});

router.get('/useability-discrete-problem', csrfProtection, function(req, res) {
  getMobileProblemPage(req, res,"Area : Useability", 'pages/values-wastes-discrete-value/useability-discrete-problem');
});

////////////////////////////////////////////////
// Maintainability
////////////////////////////////////////////////
router.get('/maintainability-discrete-score', csrfProtection, function(req, res) {
  getMobileScorePage(req, res, "Area : Maintainability", 'pages/values-wastes-discrete-value/maintainability-discrete-score');
});

router.get('/maintainability-discrete-problem', csrfProtection, function(req, res) {
  getMobileProblemPage(req, res,"Area : Maintainability", 'pages/values-wastes-discrete-value/maintainability-discrete-problem');
});

////////////////////////////////////////////////
// Durability
////////////////////////////////////////////////
router.get('/durability-discrete-score', csrfProtection, function(req, res) {
  getMobileScorePage(req, res, "Area : Durability", 'pages/values-wastes-discrete-value/durability-discrete-score');
});

router.get('/durability-discrete-problem', csrfProtection, function(req, res) {
  getMobileProblemPage(req, res,"Area : Durability", 'pages/values-wastes-discrete-value/durability-discrete-problem');
});

////////////////////////////////////////////////
// Imageability
////////////////////////////////////////////////
router.get('/imageability-discrete-score', csrfProtection, function(req, res) {
  getMobileScorePage(req, res, "Area : Imageability", 'pages/values-wastes-discrete-value/imageability-discrete-score');
});

router.get('/imageability-discrete-problem', csrfProtection, function(req, res) {
  getMobileProblemPage(req, res,"Area : Imageability", 'pages/values-wastes-discrete-value/imageability-discrete-problem');
});

////////////////////////////////////////////////
// Complexity
////////////////////////////////////////////////
router.get('/complexity-discrete-score', csrfProtection, function(req, res) {
  getMobileScorePage(req, res, "Area : Complexity", 'pages/values-wastes-discrete-value/complexity-discrete-score');
});

router.get('/complexity-discrete-problem', csrfProtection, function(req, res) {
  getMobileProblemPage(req, res,"Area : Complexity", 'pages/values-wastes-discrete-value/complexity-discrete-problem');
});

////////////////////////////////////////////////
// Precision
////////////////////////////////////////////////
router.get('/precision-discrete-score', csrfProtection, function(req, res) {
  getMobileScorePage(req, res, "Area : Precision", 'pages/values-wastes-discrete-value/precision-discrete-score');
});

router.get('/precision-discrete-problem', csrfProtection, function(req, res) {
  getMobileProblemPage(req, res,"Area : Precision", 'pages/values-wastes-discrete-value/precision-discrete-problem');
});

////////////////////////////////////////////////
// Variability
////////////////////////////////////////////////
router.get('/variability-discrete-score', csrfProtection, function(req, res) {
  getMobileScorePage(req, res, "Area : Variability", 'pages/values-wastes-discrete-value/variability-discrete-score');
});

router.get('/variability-discrete-problem', csrfProtection, function(req, res) {
  getMobileProblemPage(req, res,"Area : Variability", 'pages/values-wastes-discrete-value/variability-discrete-problem');
});

////////////////////////////////////////////////
// Sensitivity
////////////////////////////////////////////////
router.get('/sensitivity-discrete-score', csrfProtection, function(req, res) {
  getMobileScorePage(req, res, "Area : Sensitivity", 'pages/values-wastes-discrete-value/sensitivity-discrete-score');
});

router.get('/sensitivity-discrete-problem', csrfProtection, function(req, res) {
  getMobileProblemPage(req, res,"Area : Sensitivity", 'pages/values-wastes-discrete-value/sensitivity-discrete-problem');
});

////////////////////////////////////////////////
// Immaturity
////////////////////////////////////////////////
router.get('/immaturity-discrete-score', csrfProtection, function(req, res) {
  getMobileScorePage(req, res, "Area : Immaturity", 'pages/values-wastes-discrete-value/immaturity-discrete-score');
});

router.get('/immaturity-discrete-problem', csrfProtection, function(req, res) {
  getMobileProblemPage(req, res,"Area : Immaturity", 'pages/values-wastes-discrete-value/immaturity-discrete-problem');
});

////////////////////////////////////////////////
// Dangerous
////////////////////////////////////////////////
router.get('/danger-discrete-score', csrfProtection, function(req, res) {
  getMobileScorePage(req, res, "Area : Danger", 'pages/values-wastes-discrete-value/dangerous-discrete-score');
});

router.get('/danger-discrete-problem', csrfProtection, function(req, res) {
  getMobileProblemPage(req, res,"Area : Danger", 'pages/values-wastes-discrete-value/dangerous-discrete-problem');
});

router.get('/dangerous-discrete-score', csrfProtection, function(req, res) {
  getMobileScorePage(req, res, "Area : Danger", 'pages/values-wastes-discrete-value/dangerous-discrete-score');
});

router.get('/dangerous-discrete-problem', csrfProtection, function(req, res) {
  getMobileProblemPage(req, res,"Area : Danger", 'pages/values-wastes-discrete-value/dangerous-discrete-problem');
});

////////////////////////////////////////////////
// Skill Intensive
////////////////////////////////////////////////
router.get('/skills-discrete-score', csrfProtection, function(req, res) {
  getMobileScorePage(req, res, "Area : Skills", 'pages/values-wastes-discrete-value/skills-discrete-score');
});

router.get('/skills-discrete-problem', csrfProtection, function(req, res) {
  getMobileProblemPage(req, res,"Area : Skills", 'pages/values-wastes-discrete-value/skills-discrete-problem');
});

module.exports = router;
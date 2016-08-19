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

////////////////////////////////////////////////
// Waste Value Summary
////////////////////////////////////////////////
router.get('/waste-values-summary', csrfProtection, function(req, res) {

  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  ideaSeedHelpers.getUserHeadshot(req).then(function(headshotData){
    var headshotURL = headshotData['headshotURL'];
    var headshotStyle = headshotData['headshotStyle'];
    IdeaSeed.findById(req.session.idea,function(err, idea){
      currentIdea = idea._doc;
      if(req.session.ideaReview){ var reviewing = true; }
      else { var reviewing = false; }
      res.render('pages/waste-values', {
        csrfToken: req.csrfToken(),
        user : req.user || {}, idea : currentIdea,
        headshot : headshotURL,
        reviewing :  reviewing});
    });
  });
});

////////////////////////////////////////////////
// Performability
////////////////////////////////////////////////
router.get('/performability', csrfProtection, function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
    IdeaSeed.findById(req.session.idea,function(err, idea){
      currentIdea = idea._doc;
      IdeaProblem.find({ "ideaSeed" : currentIdea._id,
        'problemArea' : {
          $regex: /.*Performability.*/, $options: 'i' }},
        function (err, problems){
        if(req.session.ideaReview){
          var reviewing = true;
          res.render('pages/values-wastes/performability', {
            csrfToken: req.csrfToken(),
            user : req.user || {}, idea : currentIdea,
            problems : problems,
            reviewing :  reviewing
          });
        } else {
          var reviewing = false;
          res.render('pages/values-wastes/performability', {
            csrfToken: req.csrfToken(),
            user : req.user || {}, idea : currentIdea,
            problems : problems,
            reviewing :  reviewing
          });
        }
      });
    });
});

router.post('/performability', csrfProtection, function(req, res) {
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.perfSliderOneValue){
      thisIdea.performOne = req.body.perfSliderOneValue;
    }
    if(req.body.performProblem){
      req.body.performProblem = req.body.performProblem.slice(15);
      if(req.body.performProblem.charAt(req.body.performProblem.length-1) == "."){
        req.body.performProblem = req.body.performProblem.slice(0,-1);
      }
      var newProblem = {
        text          : req.body.performProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Performability",
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
        if(req.body.perfSliderOneValue){
          account.einsteinPoints = account.einsteinPoints + 5;
        }
        if(req.body.performProblem){
          account.einsteinPoints = account.einsteinPoints + 10;
        }
        account.save(function (err) {
          res.redirect('/affordability');
        });
    });
  } else {
    if(req.session.ideaReview){
      if(req.body.perfSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {performOne : req.body.perfSliderOneValue},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      }
      if(req.body.performProblem){
        req.body.performProblem = req.body.performProblem.slice(15);
        if(req.body.performProblem.charAt(req.body.performProblem.length-1) == "."){
          req.body.performProblem = req.body.performProblem.slice(0,-1);
        }
        var newProblem = {
          text          : req.body.performProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Performability",
          ideaSeed      : thisIdea.id,
          identifier    : "prob-"+Date.now()
        };

        IdeaProblem.create( newProblem ,
          function (err, problem) {
            if (err) return handleError(err);
            thisIdea.problemPriorities.push(problem.id);
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
          if(req.body.perfSliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.performProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
            res.redirect('/affordability');
          });
      });
    }
  }
  });
  
});



////////////////////////////////////////////////
// Affordability
////////////////////////////////////////////////
router.get('/affordability', csrfProtection, function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
    IdeaSeed.findById(req.session.idea,function(err, idea){
      currentIdea = idea._doc;
      if(req.session.ideaReview){ var reviewing = true; }
      else { var reviewing = false; }
      IdeaProblem.find({ "ideaSeed" : currentIdea._id,
        'problemArea' : { 
          $regex: /.*Affordability.*/, $options: 'i' }},
        function (err, problems){
        res.render('pages/values-wastes/affordability', { user : req.user || {},
          csrfToken: req.csrfToken(),
          idea : currentIdea,
          problems : problems,
          reviewing : reviewing });
      });
    });
});

router.post('/affordability', csrfProtection, function(req, res) {
  if(!(req.user && req.user.username)) {
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
            res.redirect('/featurability');
        });
    });
  } else {
    if(req.session.ideaReview){
      if(req.body.affordSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {affordOne : req.body.affordSliderOneValue},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      }
      if(req.body.affordProblem){
        req.body.affordProblem = req.body.affordProblem.slice(15);
        if(req.body.affordProblem.charAt(req.body.affordProblem.length-1) == "."){
          req.body.affordProblem = req.body.affordProblem.slice(0,-1);
        }
        var newProblem = {
          text          : req.body.affordProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Affordability",
          ideaSeed      : thisIdea.id,
          identifier    : "prob-"+Date.now()
        };

        IdeaProblem.create( newProblem ,
          function (err, problem) {
            if (err) return handleError(err);
            thisIdea.problemPriorities.push(problem.id);
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
            res.redirect('/featurability');
          });
      });

    } 
  }
  });



  
});

////////////////////////////////////////////////
// Featurability
////////////////////////////////////////////////
router.get('/featurability', csrfProtection, function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
    IdeaSeed.findById(req.session.idea,function(err, idea){
      currentIdea = idea._doc;
      if(req.session.ideaReview){ var reviewing = true; }
      else { var reviewing = false; }
      IdeaProblem.find({ "ideaSeed" : currentIdea._id,
        'problemArea' : { 
          $regex: /.*Featurability.*/, $options: 'i' }},
        function (err, problems){
        res.render('pages/values-wastes/featurability', { user : req.user || {},
          csrfToken: req.csrfToken(),
          idea : currentIdea,
          problems : problems,
          reviewing : reviewing });
      });
    });
});

router.post('/featurability', csrfProtection, function(req, res) {
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.featureSliderOneValue){
      thisIdea.featureOne = req.body.featureSliderOneValue;
    }
    if(req.body.featureProblem){
      req.body.featureProblem = req.body.featureProblem.slice(15);
      if(req.body.featureProblem.charAt(req.body.featureProblem.length-1) == "."){
        req.body.featureProblem = req.body.featureProblem.slice(0,-1);
      }
      var newProblem = {
        text          : req.body.featureProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Featurability",
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
        if(req.body.featureSliderOneValue){
          account.einsteinPoints = account.einsteinPoints + 5;
        }
        if(req.body.featureProblem){
          account.einsteinPoints = account.einsteinPoints + 10;
        }
        account.save(function (err) {
          res.redirect('/deliverability');
        });
    });
  } else {
    if(req.session.ideaReview){
      if(req.body.featureSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {featureOne : req.body.featureSliderOneValue},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      }
      if(req.body.featureProblem){
        req.body.featureProblem = req.body.featureProblem.slice(15);
        if(req.body.featureProblem.charAt(req.body.featureProblem.length-1) == "."){
          req.body.featureProblem = req.body.featureProblem.slice(0,-1);
        }
        var newProblem = {
          text          : req.body.featureProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Featurability",
          ideaSeed      : thisIdea.id,
          identifier    : "prob-"+Date.now()
        };

        IdeaProblem.create( newProblem ,
          function (err, problem) {
            if (err) return handleError(err);
            thisIdea.problemPriorities.push(problem.id);
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
          if(req.body.featureSliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.featureProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
            res.redirect('/deliverability');
          });
      });
    }
  }
  });



});

////////////////////////////////////////////////
// Deliverability
////////////////////////////////////////////////
router.get('/deliverability', csrfProtection, function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
    IdeaSeed.findById(req.session.idea,function(err, idea){
      currentIdea = idea._doc;
      if(req.session.ideaReview){ var reviewing = true; }
      else { var reviewing = false; }
      IdeaProblem.find({ "ideaSeed" : currentIdea._id,
        'problemArea' : { 
          $regex: /.*Deliverability.*/, $options: 'i' }},
        function (err, problems){
        res.render('pages/values-wastes/deliverability', { user : req.user || {},
          csrfToken: req.csrfToken(),
          idea : currentIdea,
          problems : problems,
          reviewing : reviewing });
      });
    });
});

router.post('/deliverability', csrfProtection, function(req, res) {
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.deliverSliderOneValue){
      thisIdea.deliverOne = req.body.deliverSliderOneValue;
    }
    if(req.body.deliverProblem){
      req.body.deliverProblem = req.body.deliverProblem.slice(15);
      if(req.body.deliverProblem.charAt(req.body.deliverProblem.length-1) == "."){
        req.body.deliverProblem = req.body.deliverProblem.slice(0,-1);
      }
      var newProblem = {
        text          : req.body.deliverProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Deliverability",
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
        if(req.body.deliverSliderOneValue){
          account.einsteinPoints = account.einsteinPoints + 5;
        }
        if(req.body.deliverProblem){
          account.einsteinPoints = account.einsteinPoints + 10;
        }
        account.save(function (err) {
          res.redirect('/useability');
        });
    });
  } else {
    if(req.session.ideaReview){
      if(req.body.deliverSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {deliverOne : req.body.deliverSliderOneValue},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      }
      if(req.body.deliverProblem){
        req.body.deliverProblem = req.body.deliverProblem.slice(15);
        if(req.body.deliverProblem.charAt(req.body.deliverProblem.length-1) == "."){
          req.body.deliverProblem = req.body.deliverProblem.slice(0,-1);
        }
        var newProblem = {
          text          : req.body.deliverProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Deliverability",
          ideaSeed      : thisIdea.id,
          identifier    : "prob-"+Date.now()
        };

        IdeaProblem.create( newProblem ,
          function (err, problem) {
            if (err) return handleError(err);
            thisIdea.problemPriorities.push(problem.id);
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
          if(req.body.deliverSliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.deliverProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
            res.redirect('/useability');
          });
      });

    } 
  }
  });



  
});

////////////////////////////////////////////////
// Useability
////////////////////////////////////////////////
router.get('/useability', csrfProtection, function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
    IdeaSeed.findById(req.session.idea,function(err, idea){
      currentIdea = idea._doc;
      if(req.session.ideaReview){ var reviewing = true; }
      else { var reviewing = false; }
      IdeaProblem.find({ "ideaSeed" : currentIdea._id,
        'problemArea' : { 
          $regex: /.*Useability.*/, $options: 'i' }},
        function (err, problems){
        res.render('pages/values-wastes/useability', { user : req.user || {},
          csrfToken: req.csrfToken(),
          idea : currentIdea,
          problems : problems,
          reviewing : reviewing });
      });
    });
});

router.post('/useability', csrfProtection, function(req, res) {

  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.useabilitySliderOneValue){
      thisIdea.useabilityOne = req.body.useabilitySliderOneValue;
    }
    if(req.body.useabilityProblem){
      req.body.useabilityProblem = req.body.useabilityProblem.slice(15);
      if(req.body.useabilityProblem.charAt(req.body.useabilityProblem.length-1) == "."){
        req.body.useabilityProblem = req.body.useabilityProblem.slice(0,-1);
      }
      var newProblem = {
        text          : req.body.useabilityProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Useability",
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
        if(req.body.useabilitySliderOneValue){
          account.einsteinPoints = account.einsteinPoints + 5;
        }
        if(req.body.useabilityProblem){
          account.einsteinPoints = account.einsteinPoints + 10;
        }
        account.save(function (err) {
          res.redirect('/maintainability');
        });
      });

      } else {
    if(req.session.ideaReview){
      if(req.body.useabilitySliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {useabilityOne : req.body.useabilitySliderOneValue},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      }
      if(req.body.useabilityProblem){
        req.body.useabilityProblem = req.body.useabilityProblem.slice(15);
        if(req.body.useabilityProblem.charAt(req.body.useabilityProblem.length-1) == "."){
          req.body.useabilityProblem = req.body.useabilityProblem.slice(0,-1);
        }
        var newProblem = {
          text          : req.body.useabilityProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Useability",
          ideaSeed      : thisIdea.id,
          identifier    : "prob-"+Date.now()
        };

        IdeaProblem.create( newProblem ,
          function (err, problem) {
            if (err) return handleError(err);
            thisIdea.problemPriorities.push(problem.id);
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
          if(req.body.useabilitySliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.useabilityProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
            res.redirect('/maintainability');
          });
      });

    } 
  }
  });



  
});

////////////////////////////////////////////////
// Maintainability
////////////////////////////////////////////////
router.get('/maintainability', csrfProtection, function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
    IdeaSeed.findById(req.session.idea,function(err, idea){
      currentIdea = idea._doc;
      if(req.session.ideaReview){ var reviewing = true; }
      else { var reviewing = false; }
      IdeaProblem.find({ "ideaSeed" : currentIdea._id,
        'problemArea' : { 
          $regex: /.*Maintainability.*/, $options: 'i' }},
        function (err, problems){
        res.render('pages/values-wastes/maintainability', { user : req.user || {},
          csrfToken: req.csrfToken(),
          idea : currentIdea,
          problems : problems,
          reviewing : reviewing });
      });
    });
});

router.post('/maintainability', csrfProtection, function(req, res) {

  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.maintainabilitySliderOneValue){
      thisIdea.maintainOne = req.body.maintainabilitySliderOneValue;
    }
    if(req.body.maintainProblem){
      req.body.maintainProblem = req.body.maintainProblem.slice(15);
      if(req.body.maintainProblem.charAt(req.body.maintainProblem.length-1) == "."){
        req.body.maintainProblem = req.body.maintainProblem.slice(0,-1);
      }
      var newProblem = {
        text          : req.body.maintainProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Maintainability",
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
        if(req.body.maintainabilitySliderOneValue){
          account.einsteinPoints = account.einsteinPoints + 5;
        }
        if(req.body.maintainProblem){
          account.einsteinPoints = account.einsteinPoints + 10;
        }
        account.save(function (err) {
          res.redirect('/durability');
        });
    });
  } else {
    if(req.session.ideaReview){
      if(req.body.maintainabilitySliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {maintainOne : req.body.maintainabilitySliderOneValue},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      }
      if(req.body.maintainProblem){
        req.body.maintainProblem = req.body.maintainProblem.slice(15);
        if(req.body.maintainProblem.charAt(req.body.maintainProblem.length-1) == "."){
          req.body.maintainProblem = req.body.maintainProblem.slice(0,-1);
        }
        var newProblem = {
          text          : req.body.maintainProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Maintainability",
          ideaSeed      : thisIdea.id,
          identifier    : "prob-"+Date.now()
        };

        IdeaProblem.create( newProblem ,
          function (err, problem) {
            if (err) return handleError(err);
            thisIdea.problemPriorities.push(problem.id);
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
          if(req.body.maintainabilitySliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.maintainProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
            res.redirect('/durability');
          });
      });

    } 
  }
  });



  
});

////////////////////////////////////////////////
// Durability
////////////////////////////////////////////////
router.get('/durability', csrfProtection, function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
    IdeaSeed.findById(req.session.idea,function(err, idea){
      currentIdea = idea._doc;
      if(req.session.ideaReview){ var reviewing = true; }
      else { var reviewing = false; }
      IdeaProblem.find({ "ideaSeed" : currentIdea._id,
        'problemArea' : { 
          $regex: /.*Durability.*/, $options: 'i' }},
        function (err, problems){
        res.render('pages/values-wastes/durability', { user : req.user || {},
          csrfToken: req.csrfToken(),
          idea : currentIdea,
          problems : problems,
          reviewing : reviewing });
      });
    });
});

router.post('/durability', csrfProtection, function(req, res) {

  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.durabilitySliderOneValue){
      thisIdea.durabilityOne = req.body.durabilitySliderOneValue;
    }
    if(req.body.durabilityProblem){
      req.body.durabilityProblem = req.body.durabilityProblem.slice(15);
      if(req.body.durabilityProblem.charAt(req.body.durabilityProblem.length-1) == "."){
        req.body.durabilityProblem = req.body.durabilityProblem.slice(0,-1);
      }
      var newProblem = {
        text          : req.body.durabilityProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Durability",
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
        if(req.body.durabilitySliderOneValue){
          account.einsteinPoints = account.einsteinPoints + 5;
        }
        if(req.body.durabilityProblem){
          account.einsteinPoints = account.einsteinPoints + 10;
        }
        account.save(function (err) {
          res.redirect('/imageability');
        });
    });
  } else {
    if(req.session.ideaReview){
      if(req.body.durabilitySliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {durabilityOne : req.body.durabilitySliderOneValue},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      }
      if(req.body.durabilityProblem){
        req.body.durabilityProblem = req.body.durabilityProblem.slice(15);
        if(req.body.durabilityProblem.charAt(req.body.durabilityProblem.length-1) == "."){
          req.body.durabilityProblem = req.body.durabilityProblem.slice(0,-1);
        }
        var newProblem = {
          text          : req.body.durabilityProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Durability",
          ideaSeed      : thisIdea.id,
          identifier    : "prob-"+Date.now()
        };

        IdeaProblem.create( newProblem ,
          function (err, problem) {
            if (err) return handleError(err);
            thisIdea.problemPriorities.push(problem.id);
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
          if(req.body.durabilitySliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.durabilityProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
            res.redirect('/imageability');
          });
      });

    } 
  }
  });



  
});

////////////////////////////////////////////////
// Imageability
////////////////////////////////////////////////
router.get('/imageability', csrfProtection, function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
    IdeaSeed.findById(req.session.idea,function(err, idea){
      currentIdea = idea._doc;
      if(req.session.ideaReview){ var reviewing = true; }
      else { var reviewing = false; }
      IdeaProblem.find({ "ideaSeed" : currentIdea._id,
        'problemArea' : { 
          $regex: /.*Imageability.*/, $options: 'i' }},
        function (err, problems){
        res.render('pages/values-wastes/imageability', { user : req.user || {},
          csrfToken: req.csrfToken(),
          idea : currentIdea,
          problems : problems,
          reviewing : reviewing });
      });
    });
});

router.post('/imageability', csrfProtection, function(req, res) {

  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.imageabilitySliderOneValue){
      thisIdea.imageOne = req.body.imageabilitySliderOneValue;
    }
    if(req.body.imageProblem){
      req.body.imageProblem = req.body.imageProblem.slice(15);
      if(req.body.imageProblem.charAt(req.body.imageProblem.length-1) == "."){
        req.body.imageProblem = req.body.imageProblem.slice(0,-1);
      }
      var newProblem = {
        text          : req.body.imageProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Imageability",
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
        if(req.body.imageabilitySliderOneValue){
          account.einsteinPoints = account.einsteinPoints + 5;
        }
        if(req.body.imageProblem){
          account.einsteinPoints = account.einsteinPoints + 10;
        }
        account.save(function (err) {
          res.redirect('/complexity');
        });
    });
  } else {
    if(req.session.ideaReview){
      if(req.body.imageabilitySliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {imageOne : req.body.imageabilitySliderOneValue},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      }
      if(req.body.imageProblem){
        req.body.imageProblem = req.body.imageProblem.slice(15);
        if(req.body.imageProblem.charAt(req.body.imageProblem.length-1) == "."){
          req.body.imageProblem = req.body.imageProblem.slice(0,-1);
        }
        var newProblem = {
          text          : req.body.imageProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Imageability",
          ideaSeed      : thisIdea.id,
          identifier    : "prob-"+Date.now()
        };

        IdeaProblem.create( newProblem ,
          function (err, problem) {
            if (err) return handleError(err);
            thisIdea.problemPriorities.push(problem.id);
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
          if(req.body.imageabilitySliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.imageProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
            res.redirect('/complexity');
          });
      });

    } 
  }
  });



  
});

////////////////////////////////////////////////
// Complexity
////////////////////////////////////////////////
router.get('/complexity', csrfProtection, function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
    IdeaSeed.findById(req.session.idea,function(err, idea){
      currentIdea = idea._doc;
      if(req.session.ideaReview){ var reviewing = true; }
      else { var reviewing = false; }
      IdeaProblem.find({ "ideaSeed" : currentIdea._id,
        'problemArea' : { 
          $regex: /.*Complexity.*/, $options: 'i' }},
        function (err, problems){
        res.render('pages/values-wastes/complexity', { user : req.user || {},
          csrfToken: req.csrfToken(),
          idea : currentIdea,
          problems : problems,
          reviewing : reviewing });
      });
    });
});

router.post('/complexity', csrfProtection, function(req, res) {

  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.complexitySliderOneValue){
      thisIdea.complexOne = req.body.complexitySliderOneValue;
    }
    if(req.body.complexProblem){
      req.body.complexProblem = req.body.complexProblem.slice(15);
      if(req.body.complexProblem.charAt(req.body.complexProblem.length-1) == "."){
        req.body.complexProblem = req.body.complexProblem.slice(0,-1);
      }
      var newProblem = {
        text          : req.body.complexProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Complexity",
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
        if(req.body.complexitySliderOneValue){
          account.einsteinPoints = account.einsteinPoints + 5;
        }
        if(req.body.complexProblem){
          account.einsteinPoints = account.einsteinPoints + 10;
        }
        account.save(function (err) {
          res.redirect('/precision');
        });
    });
  } else {
    if(req.session.ideaReview){
      if(req.body.complexitySliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {complexOne : req.body.complexitySliderOneValue},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      }
      if(req.body.complexProblem){
        req.body.complexProblem = req.body.complexProblem.slice(15);
        if(req.body.complexProblem.charAt(req.body.complexProblem.length-1) == "."){
          req.body.complexProblem = req.body.complexProblem.slice(0,-1);
        }
        var newProblem = {
          text          : req.body.complexProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Complexity",
          ideaSeed      : thisIdea.id,
          identifier    : "prob-"+Date.now()
        };

        IdeaProblem.create( newProblem ,
          function (err, problem) {
            if (err) return handleError(err);
            thisIdea.problemPriorities.push(problem.id);
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
          if(req.body.complexitySliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.complexProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
            res.redirect('/precision');
          });
      });

    } 
  }
  });



  
});

////////////////////////////////////////////////
// Precision
////////////////////////////////////////////////
router.get('/precision', csrfProtection, function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
    IdeaSeed.findById(req.session.idea,function(err, idea){
      currentIdea = idea._doc;
      if(req.session.ideaReview){ var reviewing = true; }
      else { var reviewing = false; }
      IdeaProblem.find({ "ideaSeed" : currentIdea._id,
        'problemArea' : { 
          $regex: /.*Precision.*/, $options: 'i' }},
        function (err, problems){
        res.render('pages/values-wastes/precision', { user : req.user || {},
          csrfToken: req.csrfToken(),
          idea : currentIdea,
          problems : problems,
          reviewing : reviewing });
      });
    });
});

router.post('/precision', csrfProtection, function(req, res) {

  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.precisionSliderOneValue){
      thisIdea.precisionOne = req.body.precisionSliderOneValue;
    }
    if(req.body.precisionProblem){
      req.body.precisionProblem = req.body.precisionProblem.slice(15);
      if(req.body.precisionProblem.charAt(req.body.precisionProblem.length-1) == "."){
        req.body.precisionProblem = req.body.precisionProblem.slice(0,-1);
      }
      var newProblem = {
        text          : req.body.precisionProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Precision",
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
        if(req.body.precisionSliderOneValue){
          account.einsteinPoints = account.einsteinPoints + 5;
        }
        if(req.body.precisionProblem){
          account.einsteinPoints = account.einsteinPoints + 10;
        }
        account.save(function (err) {
          res.redirect('/variability');
        });
    });
  } else {
    if(req.session.ideaReview){
      if(req.body.precisionSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {precisionOne : req.body.precisionSliderOneValue},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      }
      if(req.body.precisionProblem){
        req.body.precisionProblem = req.body.precisionProblem.slice(15);
        if(req.body.precisionProblem.charAt(req.body.precisionProblem.length-1) == "."){
          req.body.precisionProblem = req.body.precisionProblem.slice(0,-1);
        }
        var newProblem = {
          text          : req.body.precisionProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Precision",
          ideaSeed      : thisIdea.id,
          identifier    : "prob-"+Date.now()
        };

        IdeaProblem.create( newProblem ,
          function (err, problem) {
            if (err) return handleError(err);
            thisIdea.problemPriorities.push(problem.id);
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
          if(req.body.precisionSliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.precisionProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
            res.redirect('/variability');
          });
      });

    } 
  }
  });



  
});
////////////////////////////////////////////////
// Variability
////////////////////////////////////////////////
router.get('/variability', csrfProtection, function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
    IdeaSeed.findById(req.session.idea,function(err, idea){
      currentIdea = idea._doc;
      if(req.session.ideaReview){ var reviewing = true; }
      else { var reviewing = false; }
      IdeaProblem.find({ "ideaSeed" : currentIdea._id,
        'problemArea' : { 
          $regex: /.*Variability.*/, $options: 'i' }},
        function (err, problems){
        res.render('pages/values-wastes/variability', { user : req.user || {},
          csrfToken: req.csrfToken(),
          idea : currentIdea,
          problems : problems,
          reviewing : reviewing });
      });
    });
});

router.post('/variability', csrfProtection, function(req, res) {

  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.variabilitySliderOneValue){
      thisIdea.variabilityOne = req.body.variabilitySliderOneValue;
    }
    if(req.body.variabilityProblem){
      req.body.variabilityProblem = req.body.variabilityProblem.slice(15);
      if(req.body.variabilityProblem.charAt(req.body.variabilityProblem.length-1) == "."){
        req.body.variabilityProblem = req.body.variabilityProblem.slice(0,-1);
      }
      var newProblem = {
        text          : req.body.variabilityProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Variability",
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
        if(req.body.variabilitySliderOneValue){
          account.einsteinPoints = account.einsteinPoints + 5;
        }
        if(req.body.variabilityProblem){
          account.einsteinPoints = account.einsteinPoints + 10;
        }
        account.save(function (err) {
          res.redirect('/sensitivity');
        });
    });
  } else {
    if(req.session.ideaReview){
      if(req.body.variabilitySliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {variabilityOne : req.body.variabilitySliderOneValue},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      }
      if(req.body.variabilityProblem){
        req.body.variabilityProblem = req.body.variabilityProblem.slice(15);
        if(req.body.variabilityProblem.charAt(req.body.variabilityProblem.length-1) == "."){
          req.body.variabilityProblem = req.body.variabilityProblem.slice(0,-1);
        }
        var newProblem = {
          text          : req.body.variabilityProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Variability",
          ideaSeed      : thisIdea.id,
          identifier    : "prob-"+Date.now()
        };

        IdeaProblem.create( newProblem ,
          function (err, problem) {
            if (err) return handleError(err);
            thisIdea.problemPriorities.push(problem.id);
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
          if(req.body.variabilitySliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.variabilityProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
            res.redirect('/sensitivity');
          });
      });

    } 
  }
  });



  
});
////////////////////////////////////////////////
// Sensitivity
////////////////////////////////////////////////
router.get('/sensitivity', csrfProtection, function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
    IdeaSeed.findById(req.session.idea,function(err, idea){
      currentIdea = idea._doc;
      if(req.session.ideaReview){ var reviewing = true; }
      else { var reviewing = false; }
      IdeaProblem.find({ "ideaSeed" : currentIdea._id,
        'problemArea' : { 
          $regex: /.*Sensitivity.*/, $options: 'i' }},
        function (err, problems){
        res.render('pages/values-wastes/sensitivity', {
          csrfToken: req.csrfToken(),
          user : req.user || {},
          idea : currentIdea,
          problems : problems,
          reviewing : reviewing
        });
      });
    });
});

router.post('/sensitivity', csrfProtection, function(req, res) {

  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.sensitivitySliderOneValue){
      thisIdea.sensitivityOne = req.body.sensitivitySliderOneValue;
    }
    if(req.body.sensitivityProblem){
      req.body.sensitivityProblem = req.body.sensitivityProblem.slice(15);
      if(req.body.sensitivityProblem.charAt(req.body.sensitivityProblem.length-1) == "."){
        req.body.sensitivityProblem = req.body.sensitivityProblem.slice(0,-1);
      }
      var newProblem = {
        text          : req.body.sensitivityProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Sensitivity",
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
        if(req.body.sensitivitySliderOneValue){
          account.einsteinPoints = account.einsteinPoints + 5;
        }
        if(req.body.sensitivityProblem){
          account.einsteinPoints = account.einsteinPoints + 10;
        }
        account.save(function (err) {
          res.redirect('/immaturity');
        });
    });
  } else {
    if(req.session.ideaReview){
      if(req.body.sensitivitySliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {sensitivityOne : req.body.sensitivitySliderOneValue},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      }
      if(req.body.sensitivityProblem){
        req.body.sensitivityProblem = req.body.sensitivityProblem.slice(15);
        if(req.body.sensitivityProblem.charAt(req.body.sensitivityProblem.length-1) == "."){
          req.body.sensitivityProblem = req.body.sensitivityProblem.slice(0,-1);
        }
        var newProblem = {
          text          : req.body.sensitivityProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Sensitivity",
          ideaSeed      : thisIdea.id,
          identifier    : "prob-"+Date.now()
        };

        IdeaProblem.create( newProblem ,
          function (err, problem) {
            if (err) return handleError(err);
            thisIdea.problemPriorities.push(problem.id);
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
          if(req.body.sensitivitySliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.sensitivityProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
            res.redirect('/immaturity');
          });
      });

    } 
  }
  });



  
});
////////////////////////////////////////////////
// Immaturity
////////////////////////////////////////////////
router.get('/immaturity', csrfProtection, function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
    IdeaSeed.findById(req.session.idea,function(err, idea){
      currentIdea = idea._doc;
      if(req.session.ideaReview){ var reviewing = true; }
      else { var reviewing = false; }
      IdeaProblem.find({ "ideaSeed" : currentIdea._id,
        'problemArea' : { 
          $regex: /.*Immaturity.*/, $options: 'i' }},
        function (err, problems){
        res.render('pages/values-wastes/immaturity', { user : req.user || {},
          csrfToken: req.csrfToken(),
          idea : currentIdea,
          problems : problems,
          reviewing : reviewing });
      });
    });
});

router.post('/immaturity', csrfProtection, function(req, res) {

  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }
  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.immaturitySliderOneValue){
      thisIdea.immatureOne = req.body.immaturitySliderOneValue;
    }
    if(req.body.immatureProblem){
      req.body.immatureProblem = req.body.immatureProblem.slice(15);
      if(req.body.immatureProblem.charAt(req.body.immatureProblem.length-1) == "."){
        req.body.immatureProblem = req.body.immatureProblem.slice(0,-1);
      }
      var newProblem = {
        text          : req.body.immatureProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Immaturity",
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
        if(req.body.immaturitySliderOneValue){
          account.einsteinPoints = account.einsteinPoints + 5;
        }
        if(req.body.immatureProblem){
          account.einsteinPoints = account.einsteinPoints + 10;
        }
        account.save(function (err) {
          res.redirect('/dangerous');
        });
    });
  } else {
    if(req.session.ideaReview){
      if(req.body.immaturitySliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {immatureOne : req.body.immaturitySliderOneValue},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      }
      if(req.body.immatureProblem){
        req.body.immatureProblem = req.body.immatureProblem.slice(15);
        if(req.body.immatureProblem.charAt(req.body.immatureProblem.length-1) == "."){
          req.body.immatureProblem = req.body.immatureProblem.slice(0,-1);
        }
        var newProblem = {
          text          : req.body.immatureProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Immaturity",
          ideaSeed      : thisIdea.id,
          identifier    : "prob-"+Date.now()
        };

        IdeaProblem.create( newProblem ,
          function (err, problem) {
            if (err) return handleError(err);
            thisIdea.problemPriorities.push(problem.id);
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
          if(req.body.immaturitySliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.immatureProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
            res.redirect('/dangerous');
          });
      });

    } 
  }
  });



  
});
////////////////////////////////////////////////
// Dangerous
////////////////////////////////////////////////
router.get('/dangerous', csrfProtection, function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
    IdeaSeed.findById(req.session.idea,function(err, idea){
      currentIdea = idea._doc;
      if(req.session.ideaReview){ var reviewing = true; }
      else { var reviewing = false; }
      IdeaProblem.find({ "ideaSeed" : currentIdea._id,
        'problemArea' : { 
          $regex: /.*Danger.*/, $options: 'i' }},
        function (err, problems){
        res.render('pages/values-wastes/dangerous', { user : req.user || {},
          csrfToken: req.csrfToken(),
          idea : currentIdea,
          problems : problems,
          reviewing : reviewing });
      });
    });
});

router.post('/dangerous', csrfProtection, function(req, res) {

  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.dangerousSliderOneValue){
      thisIdea.dangerOne = req.body.dangerousSliderOneValue;
    }
    if(req.body.dangerProblem){
      req.body.dangerProblem = req.body.dangerProblem.slice(15);
      if(req.body.dangerProblem.charAt(req.body.dangerProblem.length-1) == "."){
        req.body.dangerProblem = req.body.dangerProblem.slice(0,-1);
      }
      var newProblem = {
        text          : req.body.dangerProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Danger",
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
        if(req.body.dangerousSliderOneValue){
          account.einsteinPoints = account.einsteinPoints + 5;
        }
        if(req.body.dangerProblem){
          account.einsteinPoints = account.einsteinPoints + 10;
        }
        account.save(function (err) {
          res.redirect('/skills');
        });
    });
  } else {
    if(req.session.ideaReview){
      if(req.body.dangerousSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {dangerOne : req.body.dangerousSliderOneValue},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      }
      if(req.body.dangerProblem){
        req.body.dangerProblem = req.body.dangerProblem.slice(15);
        if(req.body.dangerProblem.charAt(req.body.dangerProblem.length-1) == "."){
          req.body.dangerProblem = req.body.dangerProblem.slice(0,-1);
        }
        var newProblem = {
          text          : req.body.dangerProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Danger",
          ideaSeed      : thisIdea.id,
          identifier    : "prob-"+Date.now()
        };

        IdeaProblem.create( newProblem ,
          function (err, problem) {
            if (err) return handleError(err);
            thisIdea.problemPriorities.push(problem.id);
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
          if(req.body.dangerousSliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.dangerProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
            res.redirect('/skills');
          });
      });

    } 
  }
});



  
});
////////////////////////////////////////////////
// Skill Intensive
////////////////////////////////////////////////
router.get('/skills', csrfProtection, function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
    IdeaSeed.findById(req.session.idea,function(err, idea){
      currentIdea = idea._doc;
      if(req.session.ideaReview){ var reviewing = true; }
      else { var reviewing = false; }
      IdeaProblem.find({ "ideaSeed" : currentIdea._id,
        'problemArea' : { 
          $regex: /.*Skills.*/, $options: 'i' }},
        function (err, problems){
        res.render('pages/values-wastes/skills', {
          csrfToken: req.csrfToken(),
          user : req.user || {},
          idea : currentIdea,
          problems : problems,
          reviewing : reviewing });
      });
    });
});

router.post('/skills', csrfProtection, function(req, res) {

  if(!(req.user && req.user.username)) {
    res.redirect('/');
    return;
  }

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.skillsSliderOneValue){
      thisIdea.skillsOne = req.body.skillsSliderOneValue;
    }
    if(req.body.skillsProblem){
      req.body.skillsProblem = req.body.skillsProblem.slice(15);
      if(req.body.skillsProblem.charAt(req.body.skillsProblem.length-1) == "."){
        req.body.skillsProblem = req.body.skillsProblem.slice(0,-1);
      }
      var newProblem = {
        text          : req.body.skillsProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Skills",
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
        if(req.body.skillsSliderOneValue){
          account.einsteinPoints = account.einsteinPoints + 5;
        }
        if(req.body.skillsProblem){
          account.einsteinPoints = account.einsteinPoints + 10;
        }
        account.save(function (err) {
          res.redirect('/ideas/' + thisIdea.name);
        });
    });
  } else {
    if(req.session.ideaReview){
      if(req.body.skillsSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {skillsOne : req.body.skillsSliderOneValue},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      }
      if(req.body.skillsProblem){
        req.body.skillsProblem = req.body.skillsProblem.slice(15);
        if(req.body.skillsProblem.charAt(req.body.skillsProblem.length-1) == "."){
          req.body.skillsProblem = req.body.skillsProblem.slice(0,-1);
        }
        var newProblem = {
          text          : req.body.skillsProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Skills",
          ideaSeed      : thisIdea.id,
          identifier    : "prob-"+Date.now()
        };

        IdeaProblem.create( newProblem ,
          function (err, problem) {
            if (err) return handleError(err);
            thisIdea.problemPriorities.push(problem.id);
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
          if(req.body.skillsSliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.skillsProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
            res.redirect('/ideas/' + thisIdea.name);
          });
      });

    }
  }
  });

});

module.exports = router;
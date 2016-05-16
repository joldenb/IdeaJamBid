var express = require('express');
var passport = require('passport');
var mongoose = require('mongoose');
var _ = require('underscore');
var IdeaSeed = require('../models/ideaSeed');
var IdeaProblem = require('../models/ideaProblem');
var IdeaReview = require('../models/ideaReviews');
var Account = require('../models/account');
var router = express.Router();
var multer = require('multer');


var storage = multer.memoryStorage();
var uploading = multer({
  storage: storage,
  dest: '../uploads/'
});

////////////////////////////////////////////////
// Waste Value Summary
////////////////////////////////////////////////
router.get('/waste-values-summary', function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    if(req.session.ideaReview){ var reviewing = true; }
    else { var reviewing = false; }
    res.render('pages/waste-values', {
      user : req.user, idea : currentIdea,
      reviewing :  reviewing});
  });
});

////////////////////////////////////////////////
// Performability
////////////////////////////////////////////////
router.get('/performability', function(req, res) {
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
        $regex: /.*Performability.*/, $options: 'i' }},
      function (err, problems){
      res.render('pages/values-wastes/performability', {
        user : req.user, idea : currentIdea,
        problems : problems,
        reviewing :  reviewing});
    });
  });
});

router.post('/performability', function(req, res) {
  

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.perfSliderOneValue){
      thisIdea.performOne = req.body.perfSliderOneValue;
    }
    if(req.body.performProblem){
      var newProblem = {
        text          : req.body.performProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Performability",
        ideaSeed      : thisIdea.id
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
      Account.findById( req.user.id,
        function (err, account) {
          if(req.body.perfSliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.performProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
          });
      });
      if(req.body.performProblem){
        var newProblem = {
          text          : req.body.performProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Performability",
          ideaSeed      : thisIdea.id
        };

        IdeaProblem.create( newProblem ,
          function (err) {
            if (err) return handleError(err);
          }
        );
      }
    }
  }
  });








  res.redirect('/affordability');
});



////////////////////////////////////////////////
// Affordability
////////////////////////////////////////////////
router.get('/affordability', function(req, res) {
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
      res.render('pages/values-wastes/affordability', { user : req.user,
        idea : currentIdea,
        problems : problems,
        reviewing : reviewing });
    });
  });
});

router.post('/affordability', function(req, res) {

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.affordSliderOneValue){
      thisIdea.affordOne = req.body.affordSliderOneValue;
    }
    if(req.body.affordProblem){
      var newProblem = {
        text          : req.body.affordProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Affordability",
        ideaSeed      : thisIdea.id
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
      Account.findById( req.user.id,
        function (err, account) {
          if(req.body.affordSliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.affordProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
          });
      });
      if(req.body.affordProblem){
        var newProblem = {
          text          : req.body.affordProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Affordability",
          ideaSeed      : thisIdea.id
        };

        IdeaProblem.create( newProblem ,
          function (err) {
            if (err) return handleError(err);
          }
        );
      }

    } 
  }
  });



  res.redirect('/featurability');
});

////////////////////////////////////////////////
// Featurability
////////////////////////////////////////////////
router.get('/featurability', function(req, res) {
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
      res.render('pages/values-wastes/featurability', { user : req.user,
        idea : currentIdea,
        problems : problems,
        reviewing : reviewing });
    });
  });
});

router.post('/featurability', function(req, res) {

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.featureSliderOneValue){
      thisIdea.featureOne = req.body.featureSliderOneValue;
    }
    if(req.body.featureProblem){
      var newProblem = {
        text          : req.body.featureProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Featurability",
        ideaSeed      : thisIdea.id
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
      Account.findById( req.user.id,
        function (err, account) {
          if(req.body.featureSliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.featureProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
          });
      });
      if(req.body.featureProblem){
        var newProblem = {
          text          : req.body.featureProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Featurability",
          ideaSeed      : thisIdea.id
        };

        IdeaProblem.create( newProblem ,
          function (err) {
            if (err) return handleError(err);
          }
        );
      }
    }
  }
  });



  res.redirect('/deliverability');
});

////////////////////////////////////////////////
// Deliverability
////////////////////////////////////////////////
router.get('/deliverability', function(req, res) {
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
      res.render('pages/values-wastes/deliverability', { user : req.user,
        idea : currentIdea,
        problems : problems,
        reviewing : reviewing });
    });
  });
});

router.post('/deliverability', function(req, res) {

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.deliverSliderOneValue){
      thisIdea.deliverOne = req.body.deliverSliderOneValue;
    }
    if(req.body.deliverProblem){
      var newProblem = {
        text          : req.body.deliverProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Deliverability",
        ideaSeed      : thisIdea.id
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
      Account.findById( req.user.id,
        function (err, account) {
          if(req.body.deliverSliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.deliverProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
          });
      });
      if(req.body.deliverProblem){
        var newProblem = {
          text          : req.body.deliverProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Deliverability",
          ideaSeed      : thisIdea.id
        };

        IdeaProblem.create( newProblem ,
          function (err) {
            if (err) return handleError(err);
          }
        );
      }

    } 
  }
  });



  res.redirect('/useability');
});

////////////////////////////////////////////////
// Useability
////////////////////////////////////////////////
router.get('/useability', function(req, res) {
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
      res.render('pages/values-wastes/useability', { user : req.user,
        idea : currentIdea,
        problems : problems,
        reviewing : reviewing });
    });
  });
});

router.post('/useability', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.useabilitySliderOneValue){
      thisIdea.useabilityOne = req.body.useabilitySliderOneValue;
    }
    if(req.body.useabilityProblem){
      var newProblem = {
        text          : req.body.useabilityProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Useability",
        ideaSeed      : thisIdea.id
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
      Account.findById( req.user.id,
        function (err, account) {
          if(req.body.useabilitySliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.useabilityProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
          });
      });
      if(req.body.useabilityProblem){
        var newProblem = {
          text          : req.body.useabilityProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Useability",
          ideaSeed      : thisIdea.id
        };

        IdeaProblem.create( newProblem ,
          function (err) {
            if (err) return handleError(err);
          }
        );
      }

    } 
  }
  });



  res.redirect('/maintainability');
});

////////////////////////////////////////////////
// Maintainability
////////////////////////////////////////////////
router.get('/maintainability', function(req, res) {
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
      res.render('pages/values-wastes/maintainability', { user : req.user,
        idea : currentIdea,
        problems : problems,
        reviewing : reviewing });
    });
  });
});

router.post('/maintainability', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.maintainSliderOneValue){
      thisIdea.maintainOne = req.body.maintainSliderOneValue;
    }
    if(req.body.maintainProblem){
      var newProblem = {
        text          : req.body.maintainProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Maintainability",
        ideaSeed      : thisIdea.id
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
        if(req.body.maintainSliderOneValue){
          account.einsteinPoints = account.einsteinPoints + 5;
        }
        if(req.body.maintainProblem){
          account.einsteinPoints = account.einsteinPoints + 10;
        }
        account.save(function (err) {
        });
    });
  } else {
    if(req.session.ideaReview){
      if(req.body.maintainSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {maintainOne : req.body.maintainSliderOneValue},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      }
      Account.findById( req.user.id,
        function (err, account) {
          if(req.body.maintainSliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.maintainProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
          });
      });
      if(req.body.maintainProblem){
        var newProblem = {
          text          : req.body.maintainProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Maintainability",
          ideaSeed      : thisIdea.id
        };

        IdeaProblem.create( newProblem ,
          function (err) {
            if (err) return handleError(err);
          }
        );
      }

    } 
  }
  });



  res.redirect('/durability');
});

////////////////////////////////////////////////
// Durability
////////////////////////////////////////////////
router.get('/durability', function(req, res) {
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
      res.render('pages/values-wastes/durability', { user : req.user,
        idea : currentIdea,
        problems : problems,
        reviewing : reviewing });
    });
  });
});

router.post('/durability', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.durabilitySliderOneValue){
      thisIdea.durabilityOne = req.body.durabilitySliderOneValue;
    }
    if(req.body.durabilityProblem){
      var newProblem = {
        text          : req.body.durabilityProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Durability",
        ideaSeed      : thisIdea.id
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
      Account.findById( req.user.id,
        function (err, account) {
          if(req.body.durabilitySliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.durabilityProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
          });
      });
      if(req.body.durabilityProblem){
        var newProblem = {
          text          : req.body.durabilityProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Durability",
          ideaSeed      : thisIdea.id
        };

        IdeaProblem.create( newProblem ,
          function (err) {
            if (err) return handleError(err);
          }
        );
      }

    } 
  }
  });



  res.redirect('/imageability');
});

////////////////////////////////////////////////
// Imageability
////////////////////////////////////////////////
router.get('/imageability', function(req, res) {
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
      res.render('pages/values-wastes/imageability', { user : req.user,
        idea : currentIdea,
        problems : problems,
        reviewing : reviewing });
    });
  });
});

router.post('/imageability', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.imageSliderOneValue){
      thisIdea.imageOne = req.body.imageSliderOneValue;
    }
    if(req.body.imageProblem){
      var newProblem = {
        text          : req.body.imageProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Imageability",
        ideaSeed      : thisIdea.id
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
        if(req.body.imageSliderOneValue){
          account.einsteinPoints = account.einsteinPoints + 5;
        }
        if(req.body.imageProblem){
          account.einsteinPoints = account.einsteinPoints + 10;
        }
        account.save(function (err) {
        });
    });
  } else {
    if(req.session.ideaReview){
      if(req.body.imageSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {imageOne : req.body.imageSliderOneValue},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      }
      Account.findById( req.user.id,
        function (err, account) {
          if(req.body.imageSliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.imageProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
          });
      });
      if(req.body.imageProblem){
        var newProblem = {
          text          : req.body.imageProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Imageability",
          ideaSeed      : thisIdea.id
        };

        IdeaProblem.create( newProblem ,
          function (err) {
            if (err) return handleError(err);
          }
        );
      }

    } 
  }
  });



  res.redirect('/complexity');
});

////////////////////////////////////////////////
// Complexity
////////////////////////////////////////////////
router.get('/complexity', function(req, res) {
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
      res.render('pages/values-wastes/complexity', { user : req.user,
        idea : currentIdea,
        problems : problems,
        reviewing : reviewing });
    });
  });
});

router.post('/complexity', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.complexSliderOneValue){
      thisIdea.complexOne = req.body.complexSliderOneValue;
    }
    if(req.body.complexProblem){
      var newProblem = {
        text          : req.body.complexProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Complexity",
        ideaSeed      : thisIdea.id
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
        if(req.body.complexSliderOneValue){
          account.einsteinPoints = account.einsteinPoints + 5;
        }
        if(req.body.complexProblem){
          account.einsteinPoints = account.einsteinPoints + 10;
        }
        account.save(function (err) {
        });
    });
  } else {
    if(req.session.ideaReview){
      if(req.body.complexSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {complexOne : req.body.complexSliderOneValue},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      }
      Account.findById( req.user.id,
        function (err, account) {
          if(req.body.complexSliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.complexProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
          });
      });
      if(req.body.complexProblem){
        var newProblem = {
          text          : req.body.complexProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Complexity",
          ideaSeed      : thisIdea.id
        };

        IdeaProblem.create( newProblem ,
          function (err) {
            if (err) return handleError(err);
          }
        );
      }

    } 
  }
  });



  res.redirect('/precision');
});

////////////////////////////////////////////////
// Precision
////////////////////////////////////////////////
router.get('/precision', function(req, res) {
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
      res.render('pages/values-wastes/precision', { user : req.user,
        idea : currentIdea,
        problems : problems,
        reviewing : reviewing });
    });
  });
});

router.post('/precision', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.precisionSliderOneValue){
      thisIdea.precisionOne = req.body.precisionSliderOneValue;
    }
    if(req.body.precisionProblem){
      var newProblem = {
        text          : req.body.precisionProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Precision",
        ideaSeed      : thisIdea.id
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
      Account.findById( req.user.id,
        function (err, account) {
          if(req.body.precisionSliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.precisionProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
          });
      });
      if(req.body.precisionProblem){
        var newProblem = {
          text          : req.body.precisionProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Precision",
          ideaSeed      : thisIdea.id
        };

        IdeaProblem.create( newProblem ,
          function (err) {
            if (err) return handleError(err);
          }
        );
      }

    } 
  }
  });



  res.redirect('/variability');
});
////////////////////////////////////////////////
// Variability
////////////////////////////////////////////////
router.get('/variability', function(req, res) {
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
      res.render('pages/values-wastes/variability', { user : req.user,
        idea : currentIdea,
        problems : problems,
        reviewing : reviewing });
    });
  });
});

router.post('/variability', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.variabilitySliderOneValue){
      thisIdea.variabilityOne = req.body.variabilitySliderOneValue;
    }
    if(req.body.variabilityProblem){
      var newProblem = {
        text          : req.body.variabilityProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Variability",
        ideaSeed      : thisIdea.id
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
      Account.findById( req.user.id,
        function (err, account) {
          if(req.body.variabilitySliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.variabilityProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
          });
      });
      if(req.body.variabilityProblem){
        var newProblem = {
          text          : req.body.variabilityProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Variability",
          ideaSeed      : thisIdea.id
        };

        IdeaProblem.create( newProblem ,
          function (err) {
            if (err) return handleError(err);
          }
        );
      }

    } 
  }
  });



  res.redirect('/sensitivity');
});
////////////////////////////////////////////////
// Sensitivity
////////////////////////////////////////////////
router.get('/sensitivity', function(req, res) {
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
      res.render('pages/values-wastes/sensitivity', { user : req.user,
        idea : currentIdea,
        problems : problems,
        reviewing : reviewing });
    });
  });
});

router.post('/sensitivity', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.sensitivitySliderOneValue){
      thisIdea.sensitivityOne = req.body.sensitivitySliderOneValue;
    }
    if(req.body.sensitivityProblem){
      var newProblem = {
        text          : req.body.sensitivityProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Sensitivity",
        ideaSeed      : thisIdea.id
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
      Account.findById( req.user.id,
        function (err, account) {
          if(req.body.sensitivitySliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.sensitivityProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
          });
      });
      if(req.body.sensitivityProblem){
        var newProblem = {
          text          : req.body.sensitivityProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Sensitivity",
          ideaSeed      : thisIdea.id
        };

        IdeaProblem.create( newProblem ,
          function (err) {
            if (err) return handleError(err);
          }
        );
      }

    } 
  }
  });



  res.redirect('/immaturity');
});
////////////////////////////////////////////////
// Immaturity
////////////////////////////////////////////////
router.get('/immaturity', function(req, res) {
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
      res.render('pages/values-wastes/immaturity', { user : req.user,
        idea : currentIdea,
        problems : problems,
        reviewing : reviewing });
    });
  });
});

router.post('/immaturity', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.immatureSliderOneValue){
      thisIdea.immatureOne = req.body.immatureSliderOneValue;
    }
    if(req.body.immatureProblem){
      var newProblem = {
        text          : req.body.immatureProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Immaturity",
        ideaSeed      : thisIdea.id
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
        if(req.body.immatureSliderOneValue){
          account.einsteinPoints = account.einsteinPoints + 5;
        }
        if(req.body.immatureProblem){
          account.einsteinPoints = account.einsteinPoints + 10;
        }
        account.save(function (err) {
        });
    });
  } else {
    if(req.session.ideaReview){
      if(req.body.immatureSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {immatureOne : req.body.immatureSliderOneValue},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      }
      Account.findById( req.user.id,
        function (err, account) {
          if(req.body.immatureSliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.immatureProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
          });
      });
      if(req.body.immatureProblem){
        var newProblem = {
          text          : req.body.immatureProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Immaturity",
          ideaSeed      : thisIdea.id
        };

        IdeaProblem.create( newProblem ,
          function (err) {
            if (err) return handleError(err);
          }
        );
      }

    } 
  }
  });



  res.redirect('/dangerous');
});
////////////////////////////////////////////////
// Dangerous
////////////////////////////////////////////////
router.get('/dangerous', function(req, res) {
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
      res.render('pages/values-wastes/dangerous', { user : req.user,
        idea : currentIdea,
        problems : problems,
        reviewing : reviewing });
    });
  });
});

router.post('/dangerous', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.dangerSliderOneValue){
      thisIdea.dangerOne = req.body.dangerSliderOneValue;
    }
    if(req.body.dangerProblem){
      var newProblem = {
        text          : req.body.dangerProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Danger",
        ideaSeed      : thisIdea.id
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
        if(req.body.dangerSliderOneValue){
          account.einsteinPoints = account.einsteinPoints + 5;
        }
        if(req.body.dangerProblem){
          account.einsteinPoints = account.einsteinPoints + 10;
        }
        account.save(function (err) {
        });
    });
  } else {
    if(req.session.ideaReview){
      if(req.body.dangerSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {dangerOne : req.body.dangerSliderOneValue},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      }
      Account.findById( req.user.id,
        function (err, account) {
          if(req.body.dangerSliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.dangerProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
          });
      });
      if(req.body.dangerProblem){
        var newProblem = {
          text          : req.body.dangerProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Danger",
          ideaSeed      : thisIdea.id
        };

        IdeaProblem.create( newProblem ,
          function (err) {
            if (err) return handleError(err);
          }
        );
      }

    } 
  }
});



  res.redirect('/skills');
});
////////////////////////////////////////////////
// Skill Intensive
////////////////////////////////////////////////
router.get('/skills', function(req, res) {
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
      res.render('pages/values-wastes/skills', { user : req.user,
        idea : currentIdea,
        problems : problems,
        reviewing : reviewing });
    });
  });
});

router.post('/skills', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.skillsSliderOneValue){
      thisIdea.skillsOne = req.body.skillsSliderOneValue;
    }
    if(req.body.skillsProblem){
      var newProblem = {
        text          : req.body.skillsProblem,
        creator       : req.user.username, date : new Date(),
        problemArea   : "Area : Skills",
        ideaSeed      : thisIdea.id
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
      Account.findById( req.user.id,
        function (err, account) {
          if(req.body.skillsSliderOneValue){
            account.einsteinPoints = account.einsteinPoints + 5;
          }
          if(req.body.skillsProblem){
            account.einsteinPoints = account.einsteinPoints + 10;
          }
          account.save(function (err) {
          });
      });
      if(req.body.skillsProblem){
        var newProblem = {
          text          : req.body.skillsProblem,
          creator       : req.user.username, date : new Date(),
          problemArea   : "Area : Skills",
          ideaSeed      : thisIdea.id
        };

        IdeaProblem.create( newProblem ,
          function (err) {
            if (err) return handleError(err);
          }
        );
      }

    }
  }
  });



  res.redirect('/idea-summary');
});

module.exports = router;
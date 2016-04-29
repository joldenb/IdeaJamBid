var express = require('express');
var passport = require('passport');
var mongoose = require('mongoose');
var _ = require('underscore');
var IdeaSeed = require('../models/ideaSeed');
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
    res.render('pages/values-wastes/performability', {
      user : req.user, idea : currentIdea,
      reviewing :  reviewing});
  });
});

router.post('/performability', function(req, res) {
  

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.perfSliderOneValue){
      IdeaSeed.update({_id : req.session.idea}, {performOne : req.body.perfSliderOneValue,
        performProblem : req.body.performProblem},
        { multi: false }, function (err, raw) {
          console.log('The raw response from Mongo was ', raw);
      });
    } else {
      IdeaSeed.update({_id : req.session.idea}, {performProblem : req.body.performProblem},
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
  } else {
    if(req.session.ideaReview){
      if(req.body.perfSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {performOne : req.body.perfSliderOneValue,
          performProblem : req.body.performProblem},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      } else {
        IdeaReview.update({_id : req.session.ideaReview}, {performProblem : req.body.performProblem},
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
    res.render('pages/values-wastes/affordability', { user : req.user, idea : currentIdea,
      reviewing : reviewing });
  });
});

router.post('/affordability', function(req, res) {

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.affordSliderOneValue){
      IdeaSeed.update({_id : req.session.idea}, {affordOne : req.body.affordSliderOneValue,
        affordProblem : req.body.affordProblem},
        { multi: false }, function (err, raw) {
          console.log('The raw response from Mongo was ', raw);
      });
    } else {
      IdeaSeed.update({_id : req.session.idea}, {affordProblem : req.body.affordProblem},
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
  } else {
    if(req.session.ideaReview){
      if(req.body.affordSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {affordOne : req.body.affordSliderOneValue,
          affordProblem : req.body.affordProblem},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      } else {
        IdeaReview.update({_id : req.session.ideaReview}, {affordProblem : req.body.affordProblem},
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
    res.render('pages/values-wastes/featurability', { user : req.user, idea : currentIdea,
      reviewing : reviewing});
  });
});

router.post('/featurability', function(req, res) {

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.featureSliderOneValue){
      IdeaSeed.update({_id : req.session.idea}, {featureOne : req.body.featureSliderOneValue,
        featureProblem : req.body.featureProblem},
        { multi: false }, function (err, raw) {
          console.log('The raw response from Mongo was ', raw);
      });
    } else {
      IdeaSeed.update({_id : req.session.idea}, {featureProblem : req.body.featureProblem},
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
  } else {
    if(req.session.ideaReview){
      if(req.body.featureSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {featureOne : req.body.featureSliderOneValue,
          featureProblem : req.body.featureProblem},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      } else {
        IdeaReview.update({_id : req.session.ideaReview}, {featureProblem : req.body.featureProblem},
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
    res.render('pages/values-wastes/deliverability', { user : req.user, idea : currentIdea,
      reviewing: reviewing});
  });
});

router.post('/deliverability', function(req, res) {

  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.deliverSliderOneValue){
      IdeaSeed.update({_id : req.session.idea}, {deliverOne : req.body.deliverSliderOneValue,
        deliverProblem : req.body.deliverProblem},
        { multi: false }, function (err, raw) {
          console.log('The raw response from Mongo was ', raw);
      });
    } else {
      IdeaSeed.update({_id : req.session.idea}, {deliverProblem : req.body.deliverProblem},
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
  } else {
    if(req.session.ideaReview){
      if(req.body.deliverSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {deliverOne : req.body.deliverSliderOneValue,
          deliverProblem : req.body.deliverProblem},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      } else {
        IdeaReview.update({_id : req.session.ideaReview}, {deliverProblem : req.body.deliverProblem},
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
    res.render('pages/values-wastes/useability', { user : req.user, idea : currentIdea,
      reviewing : reviewing });
  });
});

router.post('/useability', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.useabilitySliderOneValue){
      IdeaSeed.update({_id : req.session.idea}, {useabilityOne : req.body.useabilitySliderOneValue,
        useabilityProblem : req.body.useabilityProblem},
        { multi: false }, function (err, raw) {
          console.log('The raw response from Mongo was ', raw);
      });
    } else {
      IdeaSeed.update({_id : req.session.idea}, {useabilityProblem : req.body.useabilityProblem},
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
      } else {
    if(req.session.ideaReview){
      if(req.body.useabilitySliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {useabilityOne : req.body.useabilitySliderOneValue,
          useabilityProblem : req.body.useabilityProblem},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      } else {
        IdeaReview.update({_id : req.session.ideaReview}, {useabilityProblem : req.body.useabilityProblem},
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
    res.render('pages/values-wastes/maintainability', { user : req.user, idea : currentIdea,
      reviewing: reviewing});
  });
});

router.post('/maintainability', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if (req.body.maintainSliderOneValue){
      IdeaSeed.update({_id : req.session.idea}, {maintainOne : req.body.maintainSliderOneValue,
        maintainProblem : req.body.maintainProblem},
        { multi: false }, function (err, raw) {
          console.log('The raw response from Mongo was ', raw);
      });
    } else {
      IdeaSeed.update({_id : req.session.idea}, {maintainProblem : req.body.maintainProblem},
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
  } else {
    if(req.session.ideaReview){
      if(req.body.maintainSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {maintainOne : req.body.maintainSliderOneValue,
          maintainProblem : req.body.maintainProblem},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      } else {
        IdeaReview.update({_id : req.session.ideaReview}, {maintainProblem : req.body.maintainProblem},
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
    res.render('pages/values-wastes/durability', { user : req.user, idea : currentIdea,
      reviewing : reviewing});
  });
});

router.post('/durability', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.durabilitySliderOneValue){
      IdeaSeed.update({_id : req.session.idea}, {durabilityOne : req.body.durabilitySliderOneValue,
        durabilityProblem : req.body.durabilityProblem},
        { multi: false }, function (err, raw) {
          console.log('The raw response from Mongo was ', raw);
      });
    } else {
      IdeaSeed.update({_id : req.session.idea}, {durabilityProblem : req.body.durabilityProblem},
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
  } else {
    if(req.session.ideaReview){
      if(req.body.durabilitySliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {durabilityOne : req.body.durabilitySliderOneValue,
          durabilityProblem : req.body.durabilityProblem},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      } else {
        IdeaReview.update({_id : req.session.ideaReview}, {durabilityProblem : req.body.durabilityProblem},
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
    res.render('pages/values-wastes/imageability', { user : req.user, idea : currentIdea,
      reviewing : reviewing});
  });
});

router.post('/imageability', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.imageSliderOneValue){
      IdeaSeed.update({_id : req.session.idea}, {imageOne : req.body.imageSliderOneValue,
        imageProblem : req.body.imageProblem},
        { multi: false }, function (err, raw) {
          console.log('The raw response from Mongo was ', raw);
      });
    } else {
      IdeaSeed.update({_id : req.session.idea}, {imageProblem : req.body.imageProblem},
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
  } else {
    if(req.session.ideaReview){
      if(req.body.imageSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {imageOne : req.body.imageSliderOneValue,
          imageProblem : req.body.imageProblem},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      } else {
        IdeaReview.update({_id : req.session.ideaReview}, {imageProblem : req.body.imageProblem},
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
    res.render('pages/values-wastes/complexity', { user : req.user, idea : currentIdea,
      reviewing : reviewing});
  });
});

router.post('/complexity', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.complexSliderOneValue){
      IdeaSeed.update({_id : req.session.idea}, {complexOne : req.body.complexSliderOneValue,
        complexProblem : req.body.complexProblem},
        { multi: false }, function (err, raw) {
          console.log('The raw response from Mongo was ', raw);
      });
    } else {
      IdeaSeed.update({_id : req.session.idea}, {complexProblem : req.body.complexProblem},
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
  } else {
    if(req.session.ideaReview){
      if(req.body.complexSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {complexOne : req.body.complexSliderOneValue,
          complexProblem : req.body.complexProblem},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      } else {
        IdeaReview.update({_id : req.session.ideaReview}, {complexProblem : req.body.complexProblem},
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
    res.render('pages/values-wastes/precision', { user : req.user, idea : currentIdea,
      reviewing: reviewing});
  });
});

router.post('/precision', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.precisionSliderOneValue){
      IdeaSeed.update({_id : req.session.idea}, {precisionOne : req.body.precisionSliderOneValue,
        precisionProblem : req.body.precisionProblem},
        { multi: false }, function (err, raw) {
          console.log('The raw response from Mongo was ', raw);
      });
    } else {
      IdeaSeed.update({_id : req.session.idea}, {precisionProblem : req.body.precisionProblem},
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
  } else {
    if(req.session.ideaReview){
      if(req.body.precisionSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {precisionOne : req.body.precisionSliderOneValue,
          precisionProblem : req.body.precisionProblem},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      } else {
        IdeaReview.update({_id : req.session.ideaReview}, {precisionProblem : req.body.precisionProblem},
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
    res.render('pages/values-wastes/variability', { user : req.user, idea : currentIdea,
      reviewing : reviewing});
  });
});

router.post('/variability', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.variabilitySliderOneValue){
      IdeaSeed.update({_id : req.session.idea}, {variabilityOne : req.body.variabilitySliderOneValue,
        variabilityProblem : req.body.variabilityProblem},
        { multi: false }, function (err, raw) {
          console.log('The raw response from Mongo was ', raw);
      });
    } else {
      IdeaSeed.update({_id : req.session.idea}, {variabilityProblem : req.body.variabilityProblem},
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
  } else {
    if(req.session.ideaReview){
      if(req.body.variabilitySliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {variabilityOne : req.body.variabilitySliderOneValue,
          variabilityProblem : req.body.variabilityProblem},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      } else {
        IdeaReview.update({_id : req.session.ideaReview}, {variabilityProblem : req.body.variabilityProblem},
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
    res.render('pages/values-wastes/sensitivity', { user : req.user, idea : currentIdea,
      reviewing : reviewing});
  });
});

router.post('/sensitivity', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.sensitivitySliderOneValue){
      IdeaSeed.update({_id : req.session.idea}, {sensitivityOne : req.body.sensitivitySliderOneValue,
        sensitivityProblem : req.body.sensitivityProblem},
        { multi: false }, function (err, raw) {
          console.log('The raw response from Mongo was ', raw);
      });
    } else {
      IdeaSeed.update({_id : req.session.idea}, {sensitivityProblem : req.body.sensitivityProblem},
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
  } else {
    if(req.session.ideaReview){
      if(req.body.sensitivitySliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {sensitivityOne : req.body.sensitivitySliderOneValue,
          sensitivityProblem : req.body.sensitivityProblem},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      } else {
        IdeaReview.update({_id : req.session.ideaReview}, {sensitivityProblem : req.body.sensitivityProblem},
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
    res.render('pages/values-wastes/immaturity', { user : req.user, idea : currentIdea,
      reviewing : reviewing});
  });
});

router.post('/immaturity', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.immatureSliderOneValue){
      IdeaSeed.update({_id : req.session.idea}, {immatureOne : req.body.immatureSliderOneValue,
        immatureProblem : req.body.immatureProblem},
        { multi: false }, function (err, raw) {
          console.log('The raw response from Mongo was ', raw);
      });
    } else {
      IdeaSeed.update({_id : req.session.idea}, {immatureProblem : req.body.immatureProblem},
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
  } else {
    if(req.session.ideaReview){
      if(req.body.immatureSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {immatureOne : req.body.immatureSliderOneValue,
          immatureProblem : req.body.immatureProblem},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      } else {
        IdeaReview.update({_id : req.session.ideaReview}, {immatureProblem : req.body.immatureProblem},
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
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    if(req.session.ideaReview){ var reviewing = true; }
    else { var reviewing = false; }
    res.render('pages/values-wastes/dangerous', { user : req.user, idea : currentIdea,
      reviewing : reviewing});
  });
});

router.post('/dangerous', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.dangerSliderOneValue){
      IdeaSeed.update({_id : req.session.idea}, {dangerOne : req.body.dangerSliderOneValue,
        dangerProblem : req.body.dangerProblem},
        { multi: false }, function (err, raw) {
          console.log('The raw response from Mongo was ', raw);
      });
    } else {
      IdeaSeed.update({_id : req.session.idea}, {dangerProblem : req.body.dangerProblem},
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
  } else {
    if(req.session.ideaReview){
      if(req.body.dangerSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {dangerOne : req.body.dangerSliderOneValue,
          dangerProblem : req.body.dangerProblem},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      } else {
        IdeaReview.update({_id : req.session.ideaReview}, {dangerProblem : req.body.dangerProblem},
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
    res.render('pages/values-wastes/skills', { user : req.user, idea : currentIdea,
      reviewing : reviewing});
  });
});

router.post('/skills', function(req, res) {


  IdeaSeed.findById(req.session.idea, function(err, thisIdea){
  // this is if the inventor is the same as the session user
  // enters info into the ideaSeed model vs the ideaReview model
  if(thisIdea.inventorName == req.user.username){
    if(req.body.skillsSliderOneValue){
      IdeaSeed.update({_id : req.session.idea}, {skillsOne : req.body.skillsSliderOneValue,
        skillsProblem : req.body.skillsProblem},
        { multi: false }, function (err, raw) {
          console.log('The raw response from Mongo was ', raw);
      });
    } else {
      IdeaSeed.update({_id : req.session.idea}, {skillsProblem : req.body.skillsProblem},
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
  } else {
    if(req.session.ideaReview){
      if(req.body.skillsSliderOneValue){
        IdeaReview.update({_id : req.session.ideaReview}, {skillsOne : req.body.skillsSliderOneValue,
          skillsProblem : req.body.skillsProblem},
          { multi: false }, function (err, raw) {
            console.log('The raw response from Mongo was ', raw);
        });
      } else {
        IdeaReview.update({_id : req.session.ideaReview}, {skillsProblem : req.body.skillsProblem},
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
    }
  }
  });



  res.redirect('/idea-summary');
});

module.exports = router;
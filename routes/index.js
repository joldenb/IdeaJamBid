var express = require('express');
var passport = require('passport');
var mongoose = require('mongoose');
var _ = require('underscore');
var ObjectId = mongoose.Schema.Types.ObjectId;
var IdeaImage = require('../models/ideaImage');
var IdeaReview = require('../models/ideaReviews');
var IdeaSeed = require('../models/ideaSeed');
var Component = require('../models/component');
var IdeaProblem = require('../models/ideaProblem');
var Account = require('../models/account');
var router = express.Router();
var multer = require('multer');


var storage = multer.memoryStorage();
var uploading = multer({
  storage: storage,
  dest: '../uploads/'
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/', function (req, res) {
    if(req.user){
      res.redirect('/begin');
    } else {
      res.render('index', { user : req.user });
    }
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/register', function(req, res) {
    res.render('pages/register', { });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.post('/register', function(req, res) {
    Account.register(new Account({ username : req.body.username,
      einsteinPoints: 0, rupees: 0, ideaSeeds: [] }), req.body.password, function(err, account) {
        if (err) {
            return res.render('pages/register', { account : account });
        }

        passport.authenticate('local')(req, res, function () {
            res.redirect('/');
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
router.get('/login', function(req, res) {
    res.render('pages/login', { user : req.user });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/begin-scoring', function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/begin-scoring', { user : req.user, idea : currentIdea });
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for begin
******************************************************************
******************************************************************
*****************************************************************/
router.get('/begin', function(req, res) {
    if(req.user){
      if (req.session.idea){
        req.session.idea = null;
      }
      if(req.user.ideaSeeds && req.user.ideaSeeds.length > 0){
        var ideaNames = [],
            j = 0;
            IdeaReview.find({"reviewer" : req.user.username}, function(err, reviews){
              var ideaSeedIDs = _.map(reviews, function(item){return item["ideaSeedId"];});
              ideaSeedIDs = _.filter(ideaSeedIDs, Boolean);
              IdeaSeed.find({_id : {$in : ideaSeedIDs}}, function(err, reviewedIdeas){
                var reviewedIdeaNames = _.map(reviewedIdeas, function(item){return item["name"];});
                var context = {"reviewedNames" : reviewedIdeaNames};
                _.each(req.user.ideaSeeds, function(element, index,  list){
                  reviewNames = this["reviewedNames"];
                  (function(reviewNames){
                  IdeaSeed.findById(element._id, function(error, document){
                    j++;
                    if(document){
                      ideaNames.push(document.name);
                      if(j == req.user.ideaSeeds.length){
                        return res.render('pages/begin', {
                          reviewNames : reviewNames,
                          user : req.user,
                          accountIdeaSeeds : ideaNames
                        });
                      }
                    } else {
                      if(j == req.user.ideaSeeds.length){
                        return res.render('pages/begin', {
                          reviewNames : reviewNames,
                          user : req.user,
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
        return res.render('pages/begin', {
          user : req.user,
          accountIdeaSeeds : []
        });
      }

    } else {
      res.redirect('/');
    }
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/view-all-ideas', function(req, res){
  if(req.user){
//    IdeaSeed.find({"visibility" : "public"}, function(err, ideas){
    IdeaSeed.find({}, function(err, ideas){
      var wasteValueScores = [0, 0];
      var ideaList = _.map(ideas, function(idea){
        wasteValueScores = IdeaSeed.getWasteValueScores(idea);
        return [
          idea['name'], //String
          idea['description'], //String
          wasteValueScores, //array of two numbers
          idea['inventorName']
        ];
      });
      res.render('pages/view-all-ideas', {
        user : req.user,
        ideas : ideaList
      });
    });
  } else {
    res.redirect('/');
  }
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/introduce-idea', function(req, res) {
    if(req.user){
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
          res.render('pages/introduce-idea', { user : req.user, idea : currentIdea });
        });
      }
    } else {
      res.redirect('/');
    }
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.post('/introduce-idea', function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  IdeaSeed.update({_id : req.session.idea}, {
    problem : req.body.purposeFor,
    name : req.body.inventionName},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/accomplish');
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/accomplish', function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/accomplish', { user : req.user, idea : currentIdea });
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.post('/accomplish', function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
  }
  IdeaSeed.update({_id : req.session.idea}, {
    description : req.body.purposeHow,
    characterization : req.body.characterization },
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/image-upload');
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
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
        descriptions : [req.body.suggestion],
        hindsight : req.body.hindsight,
        foresight : req.body.foresight,
        outsight : req.body.outsight,
        category : req.body.suggestionCategory,
        creator : contributor,
        ideaSeed : req.session.idea,
        problemID : problem.id
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
* Route for sort problems
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
* Route for sort problems
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
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/title-your-invention', function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    res.render('pages/title-your-invention', { user : req.user, idea : currentIdea });
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.post('/title-your-invention', function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  IdeaSeed.update({_id : req.session.idea}, {name : req.body.inventionName},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/image-upload');
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/problem-solver', function(req, res){
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  res.render('pages/problem-solver', { user : req.user, idea : req.session.idea });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.post('/problem-solver', function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  IdeaSeed.update({_id : req.session.idea}, {problem : req.body.problemToSolve},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/image-upload');
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.post('/save-idea-name', function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  IdeaSeed.update({_id : req.session.idea}, {
    name : req.body.inventionName},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/idea-summary');
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/image-upload', function(req, res){
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  IdeaSeed.findById(req.session.idea,function(err, idea){
    var imageURLs = [];
    currentIdea = idea._doc;
    if (idea._doc.images.length != 0){
      for (var i =0; i < idea._doc.images.length; i++){
        var j = 0;
        IdeaImage.findOne({"_id" : idea._doc.images[i]}, function(err, image){
          j++;
          if(image && image._doc && image._doc.image){
            var filename = image._doc["filename"];
            imageURLs.push([
              filename,
              "data:"+image._doc["imageMimetype"]+";base64,"+ image._doc["image"].toString('base64'),
              image._doc["uploader"]
            ]);
          }
          if (j == idea._doc.images.length){
            if(req.session.ideaReview){ var reviewing = true; }
            else { var reviewing = false; }
            res.render('pages/image-upload', {
              user : req.user,
              idea : currentIdea,
              imageURLs : imageURLs,
              reviewing: reviewing
            });
          }
        });
      }
    } else {
      if(req.session.ideaReview){ var reviewing = true; }
      else { var reviewing = false; }

      res.render('pages/image-upload', { user : req.user, idea : currentIdea, imageURLs : [], reviewing: reviewing });
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
router.post('/image-upload', uploading.single('picture'), function(req, res) {
    
    IdeaImage.find({"filename" : {$regex : ".*"+req.file.originalname+".*"}}, function(err, images){

      var newFileName = req.file.originalname + "-" + (images.length + 1).toString();

      var image = new IdeaImage({ image : req.file.buffer, imageMimetype : req.file.mimetype,
        filename : newFileName, uploader : req.user.username });
      image.save(function(err, newImage){
        if (err) {
          console.log(err);
        } else {
          IdeaSeed.update(
              { _id : req.session.idea },
              { $push : { images : newImage.id }, firstFeature : req.body.firstFeature,
              secondFeature : req.body.secondFeature, thirdFeature : req.body.thirdFeature},
              function(err, raw){
                console.log('The raw response from Mongo was ', raw);
                res.redirect('/image-upload');
              }
          );
        }
      });

    }); //end of idea image query
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
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
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/suggestion-summary', function(req, res){
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    
    IdeaProblem.find({"_id" : { $in : idea.problemPriorities}}, function(err, problems){

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
          firstProblemText : firstProblemText, reviewing : reviewing
        });
      });
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
router.get('/view-idea-suggestions', function(req, res){
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    var listOfInventorProblems = IdeaSeed.getListOfInventorProblems(currentIdea) || [];
    IdeaReview.find({"ideaSeedId" : currentIdea._id}, function(err, reviews){
      var listOfReviewerProblems = IdeaReview.getListOfReviewerProblems(reviews);
      listOfProblems = listOfInventorProblems.concat(listOfReviewerProblems);
      var problemTypes = _.map(listOfProblems, function(item){ return item[0];});
      var problemType = "";
      var categorizedSuggestions = {};
      if(req.session.ideaReview){ var reviewing = true; }
      else { var reviewing = false; }
      listOfProblems = _.sortBy(listOfProblems, function(array){ return array[2];});
      if ( listOfProblems.length > 0 ){
        problemType = listOfProblems[0][0];
        categorizedSuggestions = IdeaSeed.getCategorizedSuggestions(
          currentIdea,
          listOfProblems[0][0],
          listOfProblems[0][3]
        );
      }
      categorizedSuggestions = IdeaSeed.getCategorizedSuggestions(currentIdea);
      categorizedSuggestions = IdeaSeed.getCategoryDisplayNames(categorizedSuggestions);
      if(req.session.ideaReview){ var reviewing = true; }
      else { var reviewing = false; }

      IdeaImage.find({"_id" : {$in : idea.images}}, function(err, images){
        var imageList = _.map(images, function(image){return [image["filename"], image["uploader"], image["id"], []]});

        Component.find({"ideaSeed" : idea.id}, function(err, components){

          //attach components to images
          for(var i = 0; i < components.length; i++){
            for(var j = 0; j < components[i].images.length; j++){
              for(var k = 0; k < imageList.length; k++){
                if( components[i].images[j].imageID.toString() == imageList[k][2]){
                  imageList[k][3].push([components[i]["number"], components[i]["text"]]);
                }
              }
            }
          }

          res.render('pages/view-idea-suggestions', {
            user : req.user, //user document
            idea : currentIdea, //document
            images : imageList, //[[imagename, uploader, objectid, [componentNumber, componentText  ]]]
            problems : listOfProblems, //special structure
            categorizedSuggestions : categorizedSuggestions, //special structure
            problemType : req.session.problemType, //String maybe
            reviewing : reviewing
          });
        });
      });
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
        problems : sortedProblems });
    });
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for Key
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
* Route for Key
******************************************************************
******************************************************************
*****************************************************************/
router.post('/key-features', function(req, res) {
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  IdeaSeed.update({_id : req.session.idea}, {firstFeature : req.body.firstFeature,
    secondFeature : req.body.secondFeature, thirdFeature : req.body.thirdFeature},
    { multi: false }, function (err, raw) {
      console.log('The raw response from Mongo was ', raw);
  });
  res.redirect('/idea-seed-summary');
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
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
    newVariant["suggestions"] = incorporatedSuggestions;
    newVariant["images"] = incorporatedImages;

    currentIdea.variants.push(newVariant);
    idea.save(function(data){
      res.redirect('/idea-summary');
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
router.post('/napkin-sketch', function(req, res) {
  res.redirect('/idea-seed-summary');
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.post('/login', passport.authenticate('local'), function(req,res){
    res.redirect('/begin');
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/idea-seed-summary', function(req, res){
  if(!req.session.idea){
    res.redirect('/');
    return;
  }
  var currentIdea,
    imageURL = "";
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    if(currentIdea.image){
      imageURL = "data:"+currentIdea.imageMimetype+";base64,"+ currentIdea.image.toString('base64');
    }
    res.render('pages/idea-seed-summary', { user : req.user, idea : currentIdea,
      imgURL : imageURL });
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/napkin-sketch', function(req, res){
  res.render('pages/problem-solver', { user : req.user, idea : req.session.idea });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/problem-solver', function(req, res){
  res.render('pages/problem-solver', { user : req.user, idea : req.session.idea });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/key-features', function(req, res){
  res.render('pages/key-features', { user : req.user, idea : req.session.idea });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/contributor-idea-summary/:ideaName', function(req, res){
  IdeaSeed.findOne({ "name" : req.params.ideaName },function(err, idea){
    req.session.idea = idea._doc._id.toHexString();
    if(idea.inventorName == req.user.username){
      delete req.session.ideaReview;
      res.redirect('/idea-summary/'+req.params.ideaName);
    } else {
      res.redirect('/contributor-idea-summary');
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
router.get('/contributor-idea-summary', function(req, res){
  if(!req.session.idea){
    res.redirect('/');
    return;
  }

  IdeaSeed.findById(req.session.idea,function(err, idea){
    var imageURLs = [];
    currentIdea = idea._doc;
    var currentlyReviewing = false;


    Component.find({"ideaSeed" : idea.id}, function(err, components){
      if(idea.ideaReviews.length > 0){
        var reviewsChecked = 0;
        for(var k = 0; k < idea.ideaReviews.length; k++) {
          

          IdeaReview.findById(idea.ideaReviews[k], function(err, review){
            if(review && review.reviewer == req.user.username){
              currentlyReviewing = true;
              req.session.ideaReview = review.id;
            }
            if(reviewsChecked >= (idea.ideaReviews.length - 1) || currentlyReviewing){
              if (idea._doc.images.length != 0){
                for (var i =0; i < idea._doc.images.length; i++){
                  var j = 0;
                  

                  IdeaImage.findOne({"_id" : idea._doc.images[i]}, function(err, image){
                    j++;
                    if(image && image._doc && image._doc.image){
                      var filename = image._doc["filename"];
                      imageURLs.push([
                        filename,
                        "data:"+image._doc["imageMimetype"]+";base64,"+ image._doc["image"].toString('base64')
                      ]);
                    }
                    if (j == idea._doc.images.length){
                      res.render('pages/contributor-idea-summary', {
                        user : req.user, idea : currentIdea,
                        currentReview : review,
                        imageURLs : imageURLs,
                        components : components,
                        currentlyReviewing : currentlyReviewing
                      });
                    }
                  });
                }
              } else {
                res.render('pages/contributor-idea-summary', {
                  user : req.user, idea : currentIdea,
                  currentReview : review,
                  imageURLs : [],
                  components : components,
                  currentlyReviewing : currentlyReviewing
                });
              }
            }
            reviewsChecked++;
          });
        }
      } else {
            if (idea._doc.images.length != 0){
              for (var i =0; i < idea._doc.images.length; i++){
                var j = 0;
                IdeaImage.findOne({"_id" : idea._doc.images[i]}, function(err, image){
                  j++;
                  if(image && image._doc && image._doc.image){
                    var filename = image._doc["filename"];
                    imageURLs.push([
                      filename,
                      "data:"+image._doc["imageMimetype"]+";base64,"+ image._doc["image"].toString('base64')
                    ]);
                  }
                  if (j == idea._doc.images.length){
                    res.render('pages/contributor-idea-summary', {
                      user : req.user, idea : currentIdea,
                      imageURLs : imageURLs,
                      components : components,
                      currentlyReviewing : currentlyReviewing
                    });
                  }
                });
              }
            } else {
              res.render('pages/contributor-idea-summary', {
                user : req.user, idea : currentIdea,
                imageURLs : [],
                components : components,
                currentlyReviewing : currentlyReviewing
              });
            }
      }
    });//end of component query
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/idea-summary/:ideaName', function(req, res){
  IdeaSeed.findOne({ "name" : req.params.ideaName },function(err, idea){
    req.session.idea = idea._doc._id.toHexString();
    delete req.session.ideaReview;
    res.redirect('/idea-summary');
  });
});

/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
******************************************************************
******************************************************************
*****************************************************************/
router.get('/idea-summary', function(req, res){
  if(!req.session.idea){
    res.redirect('/');
    return;
  }

  delete req.session.ideaReview;


  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;

    IdeaProblem.find({"ideaSeed" : currentIdea._id}, null, {sort: '-date'}, function(err, problems){
      Component.find({"ideaSeed" : idea.id}, function(err, components){
        var variantDates = [],
            sortedProblems = [];
        var imageURLs = [];
        var componentsList = [];

        componentsList = _.map(components, function(item){return "Component : "+item['text'];});

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
                if(image && image._doc && image._doc.image){
                  var filename = image._doc["filename"];
                  imageURLs.push([
                    filename,
                    "data:"+image._doc["imageMimetype"]+";base64,"+ image._doc["image"].toString('base64')
                  ]);
                }
                if (j == idea._doc.images.length){
                  res.render('pages/idea-summary', { user : req.user, idea : currentIdea,
                    variantDates : variantDates,
                    problemAreas  : problemAreas,
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
                    problems : problems,
                    components : components,
                    listOfProblems : listOfProblems });
          }
        
      }); //end of components query
    }); // end of idea problems query
  });
});


/*****************************************************************
******************************************************************
******************************************************************
* Route for sort problems
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
        IdeaSeed.createApplication(currentIdea, currentAccount, res);
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
  IdeaSeed.findById(req.session.idea,function(err, idea){
    currentIdea = idea._doc;
    var currentVariant;
    var listOfProblems = IdeaSeed.getListOfInventorProblems(currentIdea) || [];
    var allCategorizedSuggestions = {};
    allCategorizedSuggestions = IdeaSeed.getCategorizedSuggestions(currentIdea);
    allCategorizedSuggestions = IdeaSeed.getCategoryDisplayNames(allCategorizedSuggestions);
    var variantCategorizedSuggestions = {};
    variantCategorizedSuggestions = IdeaSeed.getCategorizedSuggestions(currentIdea);
    variantCategorizedSuggestions = IdeaSeed.getCategoryDisplayNames(variantCategorizedSuggestions);

    
    for (var i = 0; i < currentIdea.variants.length; i++){
      if(currentIdea.variants[i].name == req.params.variantname){
        currentVariant = currentIdea.variants[i];
      }
    }

    if(!currentVariant){
      res.redirect('/idea-summary');
      return;
    }
    
    var typeLength = 0;
    for(var type in allCategorizedSuggestions){
      for(var j = 0; j < allCategorizedSuggestions[type].length; j++){
        if (currentVariant.suggestions.indexOf(allCategorizedSuggestions[type][j].suggestionID) == -1){
          for(var k = 0; k < variantCategorizedSuggestions[type].length; k++){
            if(variantCategorizedSuggestions[type][k].suggestionID == allCategorizedSuggestions[type][j].suggestionID){
              variantCategorizedSuggestions[type].splice(k,1);
            }
          }
        }
      }
    }

    IdeaImage.find({"filename" : {$in : currentVariant.images}}, function(err, images){
      var imageList = _.map(images, function(image){return [image["filename"], image["uploader"], image["id"], []]});

      Component.find({"ideaSeed" : idea.id}, function(err, components){

        //attach components to images
        for(var i = 0; i < components.length; i++){
          for(var j = 0; j < components[i].images.length; j++){
            for(var k = 0; k < imageList.length; k++){
              if( components[i].images[j].imageID.toString() == imageList[k][2]){
                imageList[k][3].push([components[i]["number"], components[i]["text"]]);
              }
            }
          }
        }
        res.render('pages/variant', { user : req.user, idea : currentIdea,
          problems : listOfProblems, categorizedSuggestions : variantCategorizedSuggestions,
          images : imageList,
          problemType : req.session.problemType });
      });
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
  IdeaImage.findOne({"filename": req.params.image} ,function(err, image){
    currentImage = image._doc;
    var annotations = [];
    if(currentImage.image){
      imageURL = "data:"+currentImage.imageMimetype+";base64," + currentImage.image.toString('base64');
      Component.find({"images.imageID" : image.id}, function(err, comps){
        var compArray = [], masterComponentList = [];
        for(var i = 0; i < comps.length; i++){
          for(var k = 0; k < comps[i].images.length; k++){
            if(comps[i].images[k].imageID.toString() == image.id) {
              compArray[i] = {
                "text" : comps[i].text,
                "number"  : comps[i].number,
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
              if ( comps[j]['ideaSeed'].toString() ==  req.session.idea ) {
                masterComponentList.push(comps[j]);
                nextNumber++;
              }
            }

            compArray = _.sortBy(compArray, 'number');
            masterComponentList = _.sortBy(masterComponentList, 'number');
            res.render('pages/annotate-image', {
              user : req.user,
              imgURL : imageURL,
              imageName : currentImage.filename,
              annotations : JSON.stringify(annotations),
              masterComponentList : masterComponentList,
              masterComponentsString : JSON.stringify(masterComponentList),
              comps : compArray,
              compsString : JSON.stringify(compArray),
              nextNumber : nextNumber
            });
        });

      });
    } else {
      res.redirect('/idea-seed-summary');
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
    if(currentImage.image){
      imageURL = "data:"+currentImage.imageMimetype+";base64," + currentImage.image.toString('base64');

      res.json({
        imgURL : imageURL
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

    Component.findOne({"text" : req.body.component}, function(err, component){
      if(err){
        res.json({error: err});
      }

      if(component){
        component.descriptions.push(req.body.description);
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
          descriptions : [req.body.description],
          images : [{
            imageID   : image.id,
            firstX    : req.body.firstX,
            firstY    : req.body.firstY,
            secondX   : req.body.secondX,
            secondY   : req.body.secondY
          }],

          ideaSeed    : req.session.idea
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
        IdeaSeed.update(
            { _id : req.session.idea },
            { $push : { ideaReviews : newReview.id } },
            function(err, raw){
              console.log('The raw response from Mongo was ', raw);
              req.session.ideaReview = newReview.id;
              res.redirect('/contributor-idea-summary');
            }
        );
      }
    });
   


  }
});

module.exports = router;
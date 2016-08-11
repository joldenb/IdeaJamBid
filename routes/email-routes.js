var express = require('express');
var router = express.Router();
var helper = require('sendgrid').mail
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var IdeaImage = require('../models/ideaImage');
var Aptitude = require('../models/aptitude');
var IdeaReview = require('../models/ideaReviews');
var IdeaSeed = require('../models/ideaSeed');
var Component = require('../models/component');
var Network = require('../models/network');
var IdeaProblem = require('../models/ideaProblem');
var Account = require('../models/account');

router.post('/share-idea', csrfProtection, function(req, res){
    var toEmailAddress = req.body.toEmailAddress;
    var fromEmailAddress = req.body.fromEmailAddress;
    var emailSubject = req.body.emailSubject;
    var emailBody = req.body.emailBody;    
    var sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
    sendgrid.send({
      to:       toEmailAddress,
      from:     fromEmailAddress,
      subject:  emailSubject,
      text:     emailBody
    }, function(err, json) {
      if (err) { return console.error(err); }
      console.log(json);
      res.redirect('back');
    });

    
});

router.post('/send-variant-contract', csrfProtection, function(req, res){
  IdeaSeed.findById(req.session.idea,function(err, idea){
    //update the variant list to show that people have been sent the contract.
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
    currentVariant['contributorsSignedOff'][req.body.contributorName] = "Pending Approval";
    currentVariant.markModified("contributorsSignedOff");
    idea.save();

    //Send the email
    var emailBody = "Greetings! " + req.body.inventor + " has sent you a request to e-sign permission"
    +" to incorporate your suggestion into their patent application.  Please contact the inventor directly, or"
    +" go to this link to approve their action of submitting the application to the USPTO.  \n\n"
    +"http://" + req.headers.host + "/ideas/"+idea.name + "/variant/" + req.body.variantName + "/contract/" + req.body.contributorName;

    var toEmailAddress = req.body.toEmailAddress;
    var fromEmailAddress = req.body.fromEmailAddress;
    var emailSubject = "Contract to File an Idea Jam Idea";
    var sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
    sendgrid.send({
      to:       toEmailAddress,
      from:     fromEmailAddress,
      subject:  emailSubject,
      text:     emailBody
    }, function(err, json) {
      if (err) { return console.error(err); }
      console.log(json);
      res.redirect('back');
    });



  });  
});


module.exports = router;
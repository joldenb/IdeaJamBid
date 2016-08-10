var express = require('express');
var router = express.Router();
var helper = require('sendgrid').mail
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var randomstring = require("randomstring");
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
      res.redirect('back');
    });

    
});

router.post('/request-reset-email', function(req, res){
    var toEmailAddress = req.body.toEmailAddress;
    var fromEmailAddress = "resetbot@ideajam.io";
    var emailSubject = "IdeaJam Password Reset Link";
    var sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
    var resetToken = randomstring.generate();
    var emailBody = "reset your password here: http://" + req.headers.host + "/reset-password/" + resetToken;

    Account.findOne({"username" : toEmailAddress}, function(err, account){

      if (err || !account){
        alert('Please try again or contact IdeaJam support to reset your password. Thank you!');
        res.redirect('/');
        return;
      }

      account.resetToken = resetToken;
      account.save();

      sendgrid.send({
        to:       toEmailAddress,
        from:     fromEmailAddress,
        subject:  emailSubject,
        text:     emailBody,
      }, function(err, json) {
        if (err) { return console.error(err); }
        res.redirect('/');
      });

    });
    
});

module.exports = router;
var express = require('express');
var router = express.Router();
var helper = require('sendgrid').mail
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });

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

module.exports = router;
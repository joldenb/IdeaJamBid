var express = require('express');
var router = express.Router();
var helper = require('sendgrid').mail
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });

router.post('/share-idea', csrfProtection, function(req, res){
    console.log(JSON.stringify(process.env));
    var sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
    sendgrid.send({
      to:       'joseph.oldenburg@gmail.com',
      from:     'sean.helvey@gmail.com',
      subject:  'Hello World',
      text:     'My first email through SendGrid.'
    }, function(err, json) {
      if (err) { return console.error(err); }
      console.log(json);
    });

    res.sendStatus(200);
});

module.exports = router;
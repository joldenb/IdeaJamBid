var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var paypal = require('paypal-rest-sdk');

router.get('/new-campaign', csrfProtection, function(req, res){
  res.render('pages/new-campaign', {
    csrfToken: req.csrfToken(),        
    user : {}
  });
});

router.post('/new-campaign', csrfProtection, function(req, res){
  res.render('pages/campaign', {
    user : {},
    csrfToken: req.csrfToken(),    
  });
});

router.get('/campaign', csrfProtection, function(req, res){
  res.render('pages/campaign', {
    user : {},
    csrfToken: req.csrfToken(),    
  });
});

router.post('/paypal-payment', csrfProtection, function(req, res){

  if (process.env.PAYPAL_CLIENT_ID) {

    paypal.configure({
      'mode': 'sandbox', //sandbox or live
      'client_id': process.env.PAYPAL_CLIENT_ID,
      'client_secret': process.env.PAYPAL_CLIENT_SECRET
    });

    var create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "credit_card",
            "funding_instruments": [{
                "credit_card": {
                    "type": "visa",
                    "number": "4032032072457549",
                    "expire_month": "09",
                    "expire_year": "2021",
                    // "cvv2": "874",
                    "first_name": "Sean",
                    "last_name": "Buyer",
                    "billing_address": {
                        "line1": "52 N Main ST",
                        "city": "Johnstown",
                        "state": "OH",
                        "postal_code": "43210",
                        "country_code": "US"
                    }
                }
            }]
        },
        "transactions": [{
            "amount": {
                "total": "8",
                "currency": "USD",
                "details": {
                    "subtotal": "6",
                    "tax": "1",
                    "shipping": "1"
                }
            },
            "description": "This is the payment transaction description.",
            "item_list": { 
                "items":[
                    {
                        "quantity":"3", 
                        "name":"Hat", 
                        "price":"2.00",  
                        "sku":"product12345", 
                        "currency":"USD"
                    }
                ]
            }            
        }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
            res.sendStatus(500);
        } else {
            console.log("Create Payment Response");
            console.log(payment);
            res.sendStatus(200);
        }
    });

  }


});

module.exports = router;
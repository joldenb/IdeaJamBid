var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var paypal = require('paypal-rest-sdk');

router.get('/crowdfunding', csrfProtection, function(req, res){

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
                    "number": "4417119669820331",
                    "expire_month": "11",
                    "expire_year": "2018",
                    "cvv2": "874",
                    "first_name": "Joe",
                    "last_name": "Shopper",
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
                "total": "7",
                "currency": "USD",
                "details": {
                    "subtotal": "5",
                    "tax": "1",
                    "shipping": "1"
                }
            },
            "description": "This is the payment transaction description."
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
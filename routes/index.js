var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var router = express.Router();


router.get('/', function (req, res) {
    res.render('index', { user : req.user });
});

router.get('/register', function(req, res) {
    res.render('pages/register', { });
});

router.post('/register', function(req, res) {
    Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
        if (err) {
            return res.render('pages/register', { account : account });
        }

        passport.authenticate('local')(req, res, function () {
            res.redirect('/');
        });
    });
});

router.get('/login', function(req, res) {
    res.render('pages/login', { user : req.user });
});

router.get('/begin', function(req, res) {
    if(req.user){
      res.render('pages/begin', { user : req.user });
    } else {
      res.redirect('/');
    }
});

router.get('/idea-name', function(req, res) {
    if(req.user){
      res.render('pages/ideaName', { user : req.user });
    } else {
      res.redirect('/');
    }
});

router.post('/login', passport.authenticate('local'), function(req, res) {
    res.redirect('/begin');
});

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});


// =====================================
// GOOGLE ROUTES =======================
// =====================================
// send to google to do the authentication
// profile gets us their basic information including their name
// email gets their emails
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', function(req, res, next) {
  passport.authenticate('google', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/login'); }

    res.render('index', { user : user });

  })(req, res, next);
});

// =====================================
// Facebook ROUTES =====================
// =====================================
// send to google to do the authentication
// profile gets us their basic information including their name
// email gets their emails
router.get('/auth/facebook', passport.authenticate('facebook', { scope:  'email' }));

router.get('/auth/facebook/callback', function(req, res, next) {
  passport.authenticate('facebook', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/login'); }

    res.render('index', { user : user });

  })(req, res, next);
});

// =====================================
// LinkedIn ROUTES =====================
// =====================================
// send to google to do the authentication
// profile gets us their basic information including their name
// email gets their emails
router.get('/auth/linkedin', passport.authenticate('linkedin'));

router.get('/auth/linkedin/callback', function(req, res, next) {
  passport.authenticate('linkedin', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/login'); }

    res.render('index', { user : user });

  })(req, res, next);
});



module.exports = router;
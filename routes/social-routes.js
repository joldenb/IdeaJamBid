var express = require('express');
var passport = require('passport');
var mongoose = require('mongoose');
var _ = require('underscore');
var IdeaSeed = require('../models/ideaSeed');
var Account = require('../models/account');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });

// =====================================
// Google ROUTES =====================
// =====================================
// send to google to do the authentication
// profile gets us their basic information including their name
// email gets their emails
router.get('/auth/google', csrfProtection, passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', csrfProtection,
  passport.authenticate('google',{
    successRedirect: '/',
    failureRedirect: '/'
}));

// =====================================
// Facebook ROUTES =====================
// =====================================
// send to google to do the authentication
// profile gets us their basic information including their name
// email gets their emails
router.get('/auth/facebook', csrfProtection, passport.authenticate('facebook', { scope:  'email' }));

router.get('/auth/facebook/callback', csrfProtection,
  passport.authenticate('facebook',{
    successRedirect: '/',
    failureRedirect: '/'
}));

// =====================================
// LinkedIn ROUTES =====================
// =====================================
// send to google to do the authentication
// profile gets us their basic information including their name
// email gets their emails
router.get('/auth/linkedin', csrfProtection, passport.authenticate('linkedin'));

router.get('/auth/linkedin/callback', csrfProtection,
  passport.authenticate('linkedin',{
    successRedirect: '/',
    failureRedirect: '/'
}));



module.exports = router;
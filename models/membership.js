var mongoose = require('mongoose');
require('../models/aptitude');
var Schema = mongoose.Schema;
var StripeCredentials = require('../models/stripeCredentials');
var UserPayout = require('../models/userPayout');
var passportLocalMongoose = require('passport-local-mongoose');
var IdeaSeed = mongoose.model('IdeaSeed').schema;
var StripeCredentials = mongoose.model('StripeCredentials');
var ObjectId = mongoose.Schema.Types.ObjectId;
var validator = require('validator');
var autopopulate = require('mongoose-autopopulate');

var Membership = new Schema({

    amountPaid : Number, //in number of cents

    customerID : String,
    customerType : { type:String, enum: ["account", "network", "aptitude"] },

    startDate : Date,
    endDate : Date,

    ideaSeedID : ObjectId,

    membershipType : { type:String, enum: ['corporate', 'twelve_month', 'six_month', 'one_month', 'non_profit'] }

}, { autoIndex: false });

module.exports = mongoose.model('Membership', Membership);
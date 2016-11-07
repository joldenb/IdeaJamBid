var exports = module.exports = {};
const sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
const _ = require('underscore');
const numConverter = require('number-to-words');
const Prize = require('../models/campaignPrize');
const PaymentService = require('../services/paymentService');

const defaultFrom = 'do.not.reply@ideajam.io';

function sendEmail(options) {
  if(!options.to) {
    throw new Error('Email to address "options.to" required!');
  }
  if(!options.subject) {
    throw new Error('Email subject "options.subject" required!');
  }
  if(!options.text) {
    throw new Error('Email body "options.text" required!');
  }
  var from = options.from ? options.from : defaultFrom;

  sendgrid.send({
    to: options.to,
    from: from,
    subject: options.subject,
    text: options.text
  }, function(err, json) {
    if(err) {
      console.error('Error sending email to ' + options.to + ' with subject ' + subject, error);
      return
    }
    return json;
  });
}

exports.sendPledgeConfirmation = function(campaignPayment, idea, user) {
  Prize.findById(campaignPayment.prize).then(function(prize) {
    const to = campaignPayment.username;
    const subject = 'Confirmation of pledge for ' + idea.name;
    const text = `${user.nickname},

Thank you for supporting ${idea.name}!

You pledged $${campaignPayment.amount} for the ${prize.name} prize.
 
When this campaign ends you will receive an email confirming the charge for this pledge or letting you know if the campaign didn't reach it's goal.

Thank you for your support!
`;
    try {
      sendEmail({to: to, subject: subject, text: text});
    } catch (error) {
      console.error(error);
    }
  });
};

exports.sendGoalReachedContributorEmails = function(emailsWithCounts, idea, campaign) {
  var totalContributors = _.reduce(emailsWithCounts, function(sum, value){ return sum + value; }, 0);
  var totalContributorsWord = numConverter.toWords(totalContributors);

  const subject = 'Campaign for ' + idea.name + ' fully funded!';

  _.each(emailsWithCounts, function(count, email) {
    var countWord = numConverter.toWords(count);
    var entitledPercent = PaymentService.contributorPaymentPercent(count, totalContributors);
    var estimatedSupporterAmount = campaign.goal * .0967; //10% of 96.7% estimated after fees.
    var entitledAmount = Math.floor(PaymentService.contributorPaymentAmount(estimatedSupporterAmount, count, totalContributors));

    var text = `The ${idea.name} crowdfunding campaign hit $${campaign.goal}!
    
As you made ${countWord} of ${totalContributorsWord} contributor suggestions, you are entitled to ${entitledPercent}% of the campaign. After expected fees you will earn about $${entitledAmount} - OR MORE!. Tell your friends about the campaign to help increase your earnings! `

    try {
      sendEmail({to: email, subject: subject, text: text});
    } catch (error) {
      console.error(error);
    }
  });
};

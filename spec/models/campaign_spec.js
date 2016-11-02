var should = require('chai').should();
var moment = require('moment');
var Campaign = require('../../models/campaign');

describe('Campaign Model', function () {
  it('should compute the time remaining for a campaign', function() {
    var campaign = new Campaign({state: 'open', startDate: new Date(), endDate: moment().add(60, 'days').toDate()});
    campaign.timeRemaining().units.should.eql('days');
    campaign.timeRemaining().time.should.be.within(59, 60);
    campaign = new Campaign({state: 'open', startDate: new Date(), endDate: moment().add(36, 'hours').toDate()});
    campaign.timeRemaining().units.should.eql('hours');
    campaign.timeRemaining().time.should.be.within(35, 36);
    campaign = new Campaign({state: 'open', startDate: new Date(), endDate: moment().add(119, 'minutes').toDate()});
    campaign.timeRemaining().units.should.eql('minutes');
    campaign.timeRemaining().time.should.be.within(119, 120);
    campaign = new Campaign({state: 'open', startDate: new Date(), endDate: moment().add(2, 'minutes').toDate()});
    campaign.timeRemaining().units.should.eql('seconds');
    campaign.timeRemaining().time.should.be.within(119, 120);
  });
});

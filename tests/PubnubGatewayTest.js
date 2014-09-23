var assert = require('assert');

describe('PubnubGateway', function () {

  it('should register a device to PubNub Push Notification Gateway', function (done) {
    PubnubGateway.addDeviceToPushNotification('0f744707bebcf74f9b7c25d48e3358945f6aa01da5ddb387462c7eaf61bbad78', '0f744707bebcf74f9b7c25d48e3358945f6aa01da5ddb387462c7eaf61bbad78', 'apns', function(err, channel) {
      if (err) {
        throw err;
      }
      assert.equal(channel, '0f744707bebcf74f9b7c25d48e3358945f6aa01da5ddb387462c7eaf61bbad78', 'Channel is ' + channel + ' and it should be 0f744707bebcf74f9b7c25d48e3358945f6aa01da5ddb387462c7eaf61bbad78');
      done();
    });
  });

});
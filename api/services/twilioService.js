var client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
var from = '+18587035477';

var TwilioService = {

  sendSms: function(to, message, callback) {
    client.messages.create({
      body: message,
      to: to,
      from: from
    }, callback);
  }
};

module.exports = TwilioService;
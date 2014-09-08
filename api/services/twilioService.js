var accountSid = 'AC122d0c9f32d2d138c4681d0c7f7cae27';
var authToken = '6f55e3ed1837f91cafbc593e262b533a';
var client = require('twilio')(accountSid, authToken);
var from = '+17743077021';

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
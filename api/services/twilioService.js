var client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

var TwilioService = {

  sendSms: function (to, message, callback) {
    this.getNumberFromPool(function(err, fromNumber) {
      if (err) {
        return callback(err);
      } else {
        client.messages.create({
          body: message,
          to: to,
          from: fromNumber
        }, callback);
      }
    });

  },

  getNumberFromPool: function (callback) {
    client.incomingPhoneNumbers.list(function (err, data) {
      if (err || !data) {
        return callback(err);
      } else {
        var phoneNumbersCount = data.incomingPhoneNumbers.length;
        var index = Math.floor(Math.random() * phoneNumbersCount);
        return callback(null, data.incomingPhoneNumbers[index].phone_number);
      }

    });
  }
};

module.exports = TwilioService;
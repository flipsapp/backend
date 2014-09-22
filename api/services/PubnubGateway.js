var pubnub = require("pubnub").init({
  publish_key: process.env.PUBNUB_PUB_KEY,
  subscribe_key: process.env.PUBNUB_SUB_KEY
});

var pushNotificationURL = 'http://pubsub.pubnub.com/v1/push/sub-key/{{subscribe_key}}/devices/{{token}}?{{action}}={{channel}}&type={{type}}';

var PubnubGateway = {

  addDeviceToPushNotification: function (token, channel, type, callback) {
    mobilePushGateway('add', token, channel, type, function (error, response, body) {
      if (body[0] === 1 && body[1] === 'Modified Channels') {
        logger.info('A new %s device %s was registered to push notification channel %s', type, token, channel);
        return callback(null, channel);
      } else {
        logger.error('Error trying to register %s device %s to push notification channel %s', type, token, channel);
        return callback('Error trying to register device to push notification service');
      }
    });
  },

  removeDeviceFromPushNotification: function (token, channel, type, callback) {
    mobilePushGateway('remove', token, channel, type, function (error, response, body) {
      if (body[0] === 1 && body[1] === 'Modified Channels') {
        logger.info('Device %s was removed from push notification channel %s', token, channel);
        return callback(null, channel);
      } else {
        logger.error('Error trying to remove %s device %s from push notification channel %s', type, token, channel);
        return callback('Error trying to remove device from push notification service');
      }
    });
  }

};

function mobilePushGateway(action, token, channel, type, callback) {
  var request = require('request').defaults({json: true});
  var pushURL = pushNotificationURL;
  pushURL = pushURL.replace('{{subscribe_key}}', process.env.PUBNUB_SUB_KEY);
  pushURL = pushURL.replace('{{token}}', token);
  pushURL = pushURL.replace('{{channel}}', channel);
  pushURL = pushURL.replace('{{type}}', type);
  pushURL = pushURL.replace('{{action}}', action);
  request.get(pushURL, function (error, response, body) {
    callback(error, response, body);
  });
}

module.exports = PubnubGateway;
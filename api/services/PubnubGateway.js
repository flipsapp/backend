var Krypto = requires('>/api/utilities/Krypto');
var pubnub = require("pubnub").init({
  publish_key: process.env.PUBNUB_PUB_KEY,
  subscribe_key: process.env.PUBNUB_SUB_KEY,
  cipher_key: process.env.PUBNUB_CIPHER_KEY,
  secret_key: process.env.PUBNUB_SECRET_KEY
});

var pushNotificationURL = 'http://pubsub.pubnub.com/v1/push/sub-key/{{subscribe_key}}/devices/{{token}}?{{action}}={{channel}}&type={{type}}',
  SUCCESS = 1;

var PubnubGateway;
PubnubGateway = {

  publishWelcomeMessage: function (room) {

    User.findOne({username: Krypto.encrypt(process.env.FLIPBOYS_USERNAME)})
      .exec(function (err, flipboysUser) {

        var now = new Date();
        var formattedNow = now.getUTCFullYear() + '-' + (now.getUTCMonth() + 1) + '-' + now.getUTCDate() + 'T' + now.getUTCHours() + ':' + now.getUTCMinutes() + ':' + now.getUTCSeconds() + '.' + now.getUTCMilliseconds() + 'Z';

        var welcomeMessage = {
          fromUserId: flipboysUser.id,
          type: "2",
          flipMessageId: "" + flipboysUser.id + ":" + new Date().getTime(),
          pn_apns: {
            aps: {
              alert: "You received a new Flip message from FlipBoys"
            }
          },
          sentAt: formattedNow
        };

        var welcomeFlips = [];

        Welcome.find({sort: 'sequence ASC'}).exec(function (err, flips) {
          if (err || !flips || flips.length <= 0) {
            console.log("Error. Welcome message not found in database.")
          } else {
            console.log("is about to send welcome message");
            for (var i = 0; i < flips.length; i++) {
              var flip = flips[i];
              welcomeFlips.push({
                id: flip.sequence,
                thumbnailURL: flip.thumbnailURL,
                backgroundURL: flip.backgroundURL,
                word: flip.word,
                updatedAt: flip.updatedAt
              });
            }
            welcomeMessage.content = welcomeFlips;
            pubnub.publish({
              channel: room.pubnubId,
              message: welcomeMessage,
              callback: function (e) {
                console.log("Successfully sent the welcome message to channel " + room.pubnubId);
              },
              error: function (e) {
                console.log("Error sending the welcome message. [" + e + "]")
              }
            });
          }
        });
      });
  },

  addDeviceToPushNotification: function (token, channel, platform, callback) {
    var type = platform === 'ios' ? 'apns' : 'gcm';
    mobilePushGateway('add', token, channel, type, function (error, response, body) {
      if (body[0] === SUCCESS && body[1] === 'Modified Channels') {
        logger.info('A new %s device %s was registered to push notification channel %s', type, token, channel);
        return callback(null, channel);
      } else {
        logger.error('Error trying to register %s device %s to push notification channel %s. Details: %s', type, token, channel, error || '');
        return callback('Error trying to register device to push notification service');
      }
    });
  },

  removeDeviceFromPushNotification: function (token, channel, platform, callback) {
    var type = platform === 'ios' ? 'apns' : 'gcm';
    mobilePushGateway('remove', token, channel, type, function (error, response, body) {
      if (body[0] === SUCCESS && body[1] === 'Modified Channels') {
        logger.info('Device %s was removed from push notification channel %s', token, channel);
        return callback(null, channel);
      } else {
        logger.error('Error trying to remove %s device %s from push notification channel %s. Details: %s', type, token, channel, error || '');
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
var Krypto = requires('>/api/utilities/Krypto');

var crypto = require('crypto');

var pubnub = require("pubnub").init({
  ssl: true,
  publish_key: process.env.PUBNUB_PUB_KEY,
  subscribe_key: process.env.PUBNUB_SUB_KEY
});

var pushNotificationURL = 'http://pubsub.pubnub.com/v1/push/sub-key/{{subscribe_key}}/devices/{{token}}?{{action}}={{channel}}&type={{type}}',
  SUCCESS = 1;

var PubnubGateway = {

  publishWelcomeMessage: function (user) {

    // retrieve flipboys user
    User.findOne({username: Krypto.encrypt(process.env.TEAMFLIPS_USERNAME)})
      .exec(function (err, teamFlipsUser) {

        if (err || !teamFlipsUser) {
          logger.error('Flipboys user not found');
          return;
        }

        // retrieve welcome message room (a room whose participants are the current user and flipboys)
        Participant.query('select room from participant where user = ' + user.id + ' and room in (select room from participant where user = ' + teamFlipsUser.id +')', function(err, queryResult) {
          Room.findOne(queryResult[0].room).exec(function(err, room) {
            if (err || !room) {
              logger.error(err);
              logger.error('Welcome room not found');
              return;
            }

            var now = new Date();
            var formattedNow = now.getUTCFullYear() + '-' + (now.getUTCMonth() + 1) + '-' + now.getUTCDate() + 'T' + now.getUTCHours() + ':' + now.getUTCMinutes() + ':' + now.getUTCSeconds() + '.' + now.getUTCMilliseconds() + 'Z';

            var welcomeMessage = {
              pn_apns: {
                aps: {
                  alert: "You received a new Flip message from Team Flips",
                  sound: "default"
                },
                room_id: room.id
              },
              data: {
                fromUserId: teamFlipsUser.id,
                type: "2",
                flipMessageId: "" + teamFlipsUser.id + ":" + new Date().getTime(),
                sentAt: formattedNow
              }

            };

            var welcomeFlips = [];

            Welcome.find({sort: 'sequence ASC'})
              .populate('flip')
              .exec(function (err, welcomeMessageFragments) {
              if (err || !welcomeMessageFragments || welcomeMessageFragments.length <= 0) {
                logger.error("Error. Welcome message not found in database.");
              } else {
                logger.info("is about to send welcome message");
                for (var i = 0; i < welcomeFlips.length; i++) {
                  var welcomeMessageFragment = welcomeMessageFragments[i];
                  welcomeFlips.push({
                    id: welcomeMessageFragment.sequence,
                    thumbnailURL: welcomeMessageFragment.flip.thumbnailURL,
                    backgroundURL: welcomeMessageFragment.flip.backgroundURL,
                    word: welcomeMessageFragment.flip.word,
                    isPrivate: true,
                    updatedAt: welcomeMessageFragment.flip.updatedAt
                  });
                }

                welcomeMessage.data.content = welcomeFlips;

                welcomeMessage.data = PubnubGateway.encrypt(welcomeMessage.data);

                pubnub.publish({
                  channel: room.pubnubId,
                  message: welcomeMessage,
                  callback: function (e) {
                    logger.info('Welcome message sent to user: ' + user.id);
                  },
                  error: function (e) {
                    logger.error("Error sending the welcome message. [" + e + "]");
                  }
                });
              }
            });

          });

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
  },

  encrypt: function (input) {
    if (input == null || input == '') {
      return '';
    }
    var iv = "0123456789012345";
    function get_padded_key(key) {
      return crypto.createHash('sha256').update(key).digest("hex").slice(0,32);
    }
    var plain_text = JSON['stringify'](input);
    var cipher = crypto.createCipheriv('aes-256-cbc', get_padded_key(process.env.PUBNUB_CIPHER_KEY), iv);
    var base_64_encrypted = cipher.update(plain_text, 'utf8', 'base64') + cipher.final('base64');
    return base_64_encrypted || input;
  },

  decrypt: function (input) {
    if (input == null || input == '') {
      return '';
    }
    var iv = "0123456789012345";
    function get_padded_key(key) {
      return crypto.createHash('sha256').update(key).digest("hex").slice(0,32);
    }
    var decipher = crypto.createDecipheriv('aes-256-cbc', get_padded_key(process.env.PUBNUB_CIPHER_KEY), iv);
    try {
      var decrypted = decipher.update(input, 'base64', 'utf8') + decipher.final('utf8');
    } catch (e) {
      return null;
    }
    return JSON.parse(decrypted);
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
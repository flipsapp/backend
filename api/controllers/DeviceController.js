/**
 * DeviceController
 *
 * @description :: Server-side logic for managing Devices
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var actionUtil = requires('>/node_modules/sails/lib/hooks/blueprints/actionUtil');
var Krypto = requires('>/api/utilities/Krypto');

var MAX_RETRY_COUNT = 2;


var DeviceController = {

  findOne: function (request, response) {
    var deviceId = request.params.id;

    if (!deviceId) {
      return response.send(400, new FlipsError('Missing parameter [id]'));
    }

    Device.findOne(deviceId)
      .exec(function (error, device) {
        if (error) {
          var errmsg = new FlipsError('Error retrieving the device.', error.details);
          logger.error(errmsg);
          return response.send(500, errmsg);
        }

        if (!device) {
          return response.send(404, new FlipsError('Device not found', 'Id=' + deviceId));
        }

        return response.send(200, device);
      }
    );
  },

  create: function (request, response) {
    var userId = request.params.parentid;
    var platform = request.param('platform');
    var uuid = request.param('uuid');
    var phoneNumber = request.param('phoneNumber');

    if (!userId) {
      return response.send(400, new FlipsError('Missing parameter [User Id].'));
    }

    if (!platform) {
      return response.send(400, new FlipsError('Missing parameter [Device platform].'));
    }

    Device
      .create({user: userId, platform: platform, uuid: uuid})
      .exec(function (err, device) {
        if (err) {
          var errmsg = new FlipsError('Error creating device.', err.details);
          logger.error(errmsg);
          return response.send(500, errmsg);
        }

        if (!device) {
          return response.send(400, new FlipsError('Error creating device.', 'Device returned empty.'));
        }

        User.findOne(userId).exec(function (err, user) {

          if (!user.phoneNumber) {
            if (!phoneNumber) {
              return response.send(400, new FlipsError('Missing parameter [Phone number].'));
            }
            user.phoneNumber = Krypto.encrypt(phoneNumber);
            user.save();
          }

          if (!user.phoneNumber) {
            if (!phoneNumber) {
              return response.send(400, new FlipsError('Missing parameter [Phone number].'));
            }
            user.phoneNumber = Krypto.encrypt(phoneNumber);
            user.save();
          }

          var numberToSendSMS = phoneNumber ? phoneNumber : Krypto.decrypt(user.phoneNumber);

          sendVerificationCode(device, numberToSendSMS);

          console.log('sending verification code to ' + numberToSendSMS);

          logger.debug('sending verification code');

          return response.send(201, device);
        });
      }
    );
  },

  verify: function (request, response) {
    var userId = request.params.parentid;
    var deviceId = request.params.id;
    var verificationCode = request.param('verification_code');
    var phoneNumber = request.param('phoneNumber');

    if (!userId) {
      return response.send(400, new FlipsError('Missing parameter [User Id]'));
    }

    if (!deviceId) {
      return response.send(400, new FlipsError('Missing parameter [Device Id]'));
    }

    if (!verificationCode) {
      return response.send(400, new FlipsError('Missing parameter [Verification Code]'));
    }

    Device.findOne(deviceId)
      .populate('user')
      .exec(function (error, device) {

        if (error) {
          var errmsg = new FlipsError('Error retrieving the device.', error.details);
          logger.error(errmsg);
          return response.send(500, errmsg);
        }

        if (!device) {
          return response.send(404, new FlipsError('Device not found.', 'Device id = ' + deviceId));
        }

        // just ensure that the device is related to user parameter
        if (userId != device.user.id) {
          return response.send(403, new FlipsError('This device does not belong to you'));
        }

        if (device.verificationCode != verificationCode) {
          device.retryCount++;
          device.isVerified = false;
          device.save();
          if (device.retryCount > MAX_RETRY_COUNT) {
            sendVerificationCode(device, Krypto.decrypt(device.user.phoneNumber));
            return response.send(400, new FlipsError(MAX_RETRY_COUNT + ' incorrect entries. Check your messages for a new code.'));
          } else {
            return response.send(400, new FlipsError('Wrong validation code.'));
          }
        }

        device.isVerified = true;
        device.retryCount = 0;

        User.findOne(userId).exec(function(err, user) {
          if (err) {
            return response.send(500, new FLipsError('Verification Error', 'Internal server error'));
          }
          if (!user) {
            return response.send(404, new FLipsError('Verification Error', 'User not found.'));
          }

          if (user.isTemporary) {
            user.isTemporary = false;
            PubnubGateway.publishWelcomeMessage(user);
          }
          user.save(function (errSavingUser) {

            device.user = user.id;
            device.save();

            if (phoneNumber) {
              user.phoneNumber = Krypto.encrypt(phoneNumber);
              user.save(function (error) {
                if (error) {
                  return response.send(500, new FlipsError('Error saving user after update device'));
                }
                return response.send(200, device);
              });
            } else {
              return response.send(200, device);
            }
          });
        });
      }
    );
  },

  resendVerificationCode: function (request, response) {
    var userId = request.params.parentid;
    var deviceId = request.params.id;

    if (!userId) {
      return response.send(400, new FlipsError('Missing parameter [User Id]'));
    }

    if (!deviceId) {
      return response.send(400, new FlipsError('Missing parameter [Device Id]'));
    }

    Device.findOne(deviceId)
      .exec(function (error, device) {

        if (error) {
          var errmsg = new FlipsError('Error retrieving the device.', error.details);
          logger.error(errmsg);
          return response.send(500, errmsg);
        }

        if (!device) {
          return response.send(404, new FlipsError('Device not found.', 'Device id = ' + deviceId));
        }

        // just ensure that the device is related to user parameter
        if (userId != device.user) {
          return response.send(403, new FlipsError('This device does not belong to you'));
        }

        User.findOne(userId).exec(function (error, user) {

          if (error) {
            return response.send(500, new FlipsError('Error retrieving the user.', error.details));
          }

          if (!user) {
            return response.send(404, new FlipsError('User not found.', 'Device id = ' + deviceId));
          }

          sendVerificationCode(device, Krypto.decrypt(user.phoneNumber));
        });

        return response.send(200, device);
      }
    );

  },

  registerForPushNotifications: function (request, response) {

    var userId = request.params.parentid;
    var deviceId = request.params.id;

    if (!userId) {
      return response.send(400, new FlipsError('Missing parameter [User Id]'));
    }

    if (!deviceId) {
      return response.send(400, new FlipsError('Missing parameter [Device Id]'));
    }

    Device.findOne(deviceId)
      .exec(function (error, device) {

        if (error) {
          var errmsg = new FlipsError('Error retrieving the device.', error.details);
          logger.error(errmsg);
          return response.send(500, errmsg);
        }

        if (!device) {
          return response.send(404, new FlipsError('Device not found.', 'Device id = ' + deviceId));
        }

        // just ensure that the device is related to user parameter
        if (userId != device.user) {
          return response.send(403, new FlipsError('This device does not belong to you'));
        }

        Participant.find({user: userId}).exec(function (error, participants) {

          if (error) {
            return response.send(500, new FlipsError('Error retrieving user rooms.'));
          }

          if (!participants) {
            return response.send(404, new FlipsError('User rooms not found.'));
          }

          var roomIds = [];

          for (var i = 0; i < participants.length; i++) {
            roomIds.push(participants[i].room);
          }

          Room.find(roomIds).exec(function (error, rooms) {

            if (error) {
              return response.send(500, new FlipsError('Error retrieving rooms for user.'));
            }

            if (!rooms) {
              return response.send(404, new FlipsError('Rooms not found.'));
            }

            var channels = [];

            for (var j = 0; j < rooms.length; j++) {
              channels.push(rooms[j].pubnubId);
            }

            for (var k = 0; k < channels.length; k++) {
              PubnubGateway.addDeviceToPushNotification(device.uuid, channels[k], device.platform, function (error, channel) {})
            }

            return response.send(200, {});

          });

        });

      }
    );
  },

  unregisterForPushNotifications: function (request, response) {

    var userId = request.params.parentid;
    var deviceId = request.params.id;

    if (!userId) {
      return response.send(400, new FlipsError('Missing parameter [User Id]'));
    }

    if (!deviceId) {
      return response.send(400, new FlipsError('Missing parameter [Device Id]'));
    }

    Device.findOne(deviceId)
      .exec(function (error, device) {

        if (error) {
          var errmsg = new FlipsError('Error retrieving the device.', error.details);
          logger.error(errmsg);
          return response.send(500, errmsg);
        }

        if (!device) {
          return response.send(404, new FlipsError('Device not found.', 'Device id = ' + deviceId));
        }

        // just ensure that the device is related to user parameter
        if (userId != device.user) {
          return response.send(403, new FlipsError('This device does not belong to you'));
        }

        Participant.find({user: userId}).exec(function (error, participants) {

          if (error) {
            return response.send(500, new FlipsError('Error retrieving user rooms.'));
          }

          if (!participants) {
            return response.send(404, new FlipsError('User rooms not found.'));
          }

          var roomIds = [];

          for (var i = 0; i < participants.length; i++) {
            roomIds.push(participants[i].room);
          }

          Room.find(roomIds).exec(function (error, rooms) {

            if (error) {
              return response.send(500, new FlipsError('Error retrieving rooms for user.'));
            }

            if (!rooms) {
              return response.send(404, new FlipsError('Rooms not found.'));
            }

            var channels = [];

            for (var j = 0; j < rooms.length; j++) {
              channels.push(rooms[j].pubnubId);
            }

            for (var k = 0; k < channels.length; k++) {
              PubnubGateway.removeDeviceFromPushNotification(device.uuid, channels[k], device.platform, function (error, channel) {})
            }

            return response.send(200, {});

          });

        });

      }
    );

  }

};

module.exports = DeviceController;

var sendVerificationCode = function (device, phoneNumber) {
  var verificationCode = Math.floor(Math.random() * 8999) + 1000;
  var message = 'Your Flips verification code: ' + verificationCode;

  logger.debug(message);

  device.verificationCode = verificationCode;
  device.isVerified = false;
  device.retryCount = 0;
  device.save();

  twilioService.sendSms(phoneNumber, message, function (err, message) {
    logger.info(err || message);
  });

};
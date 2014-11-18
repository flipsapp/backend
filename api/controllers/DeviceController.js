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
          return response.send(404, new FlipsError('Device not found', 'Id='+deviceId));
        }

        return response.send(200, device);
      }
    );
  },

  create: function (request, response) {
    var userId = request.params.parentid;
    var platform = request.param('platform');
    var uuid = request.param('uuid');

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
        User.findOne(device.user).exec(function(err, user) {
          device.user = user;

          sendVerificationCode(device);
          PubnubGateway.addDeviceToPushNotification(device.uuid, device.uuid, device.platform, function(err, channel) {
            if (err) {
              logger.error(new FlipsError(err));
            }
          });
          device.user = user.id;
          return response.send(201, device);
        });
      }
    );
  },

  verify: function (request, response) {
    var userId = request.params.parentid;
    var deviceId = request.params.id;
    var verificationCode = request.param('verification_code');

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

          if (device.retryCount > MAX_RETRY_COUNT) {
            sendVerificationCode(device);
          }

          device.save();
          return response.send(400, new FlipsError('Wrong validation code.'));
        }

        device.isVerified = true;
        device.retryCount = 0;
        device.save();

        device.user = device.user.id;

        return response.send(200, device);
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
        if (userId != device.user) {
          return response.send(403, new FlipsError('This device does not belong to you'));
        }

        sendVerificationCode(device);

        return response.send(200, device);
      }
    );

  }
	
};

module.exports = DeviceController;

var sendVerificationCode = function(device) {
  var verificationCode = Math.floor(Math.random() * 8999) + 1000;
  var message = 'Your Flips verification code: ' + verificationCode;

  device.verificationCode = verificationCode;
  device.retryCount = 0;
  device.save();

  twilioService.sendSms(Krypto.decrypt(device.user.phoneNumber), message, function (err, message) {
    logger.info(err || message);
  });
};
/**
 * DeviceController
 *
 * @description :: Server-side logic for managing Devices
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var actionUtil = requires('>/node_modules/sails/lib/hooks/blueprints/actionUtil');
var MAX_RETRY_COUNT = 2;

var DeviceController = {

  findOne: function (request, response) {
    var deviceId = request.params.id;

    if (!deviceId) {
      return response.send(400, new MugError('Missing parameter [id]'));
    }

    Device.findOne(deviceId)
      .exec(function (error, device) {
        if (error) {
          var errmsg = new MugError('Error retrieving the device.', error.details);
          logger.error(errmsg);
          return response.send(500, errmsg);
        }

        if (!device) {
          return response.send(404, new MugError('Device not found', 'Id='+deviceId));
        }

        return response.send(200, device);
      }
    );
  },

  create: function (request, response) {
    var user = request.params.parentid;
    var device = actionUtil.parseValues(request);
    if (!user) {
      return response.send(400, new MugError('Missing parameter [User Id].'));
    }
    if (!device.platform) {
      return response.send(400, new MugError('Missing parameter [Device platform].'));
    }
    if (!device.phoneNumber) {
      return response.send(400, new MugError('Missing parameter [Device phone number].'));
    }
    device.user = user;
    Device.create(device)
      .exec(function (err, device) {
        if (err) {
          var errmsg = new MugError('Error creating device.', err.details);
          logger.error(errmsg);
          return response.send(500, errmsg);
        }
        if (!device) {
          return response.send(400, new MugError('Error creating device.', 'Device returned empty.'));
        }
        PubnubGateway.addDeviceToPushNotification(device.uuid, device.uuid, device.platform, function(err, channel) {
          if (err) {
            return response.send(500, new MugError(err));
          }
          sendVerificationCode(device);
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
      return response.send(400, new MugError('Missing parameter [User Id]'));
    }

    if (!deviceId) {
      return response.send(400, new MugError('Missing parameter [Device Id]'));
    }

    if (!verificationCode) {
      return response.send(400, new MugError('Missing parameter [Verification Code]'));
    }

    Device.findOne(deviceId)
      .populate('user')
      .exec(function (error, device) {

        if (error) {
          var errmsg = new MugError('Error retrieving the device.', error.details);
          logger.error(errmsg);
          return response.send(500, errmsg);
        }

        if (!device) {
          return response.send(404, new MugError('Device not found.', 'Device id = ' + deviceId));
        }

        // just ensure that the device is related to user parameter
        if (userId != device.user.id) {
          return response.send(403, new MugError('This device does not belong to you'));
        }

        if (device.verificationCode != verificationCode) {
          device.retryCount++;
          device.isVerified = false;

          if (device.retryCount > MAX_RETRY_COUNT) {
            sendVerificationCode(device);
          }

          device.save();
          return response.send(400, new MugError('Wrong validation code.'));
        }

        device.isVerified = true;
        device.retryCount = 0;
        device.save();

        return response.send(200, device);
      }
    );
  },

  resendVerificationCode: function (request, response) {
    var userId = request.params.parentid;
    var deviceId = request.params.id;

    if (!userId) {
      return response.send(400, new MugError('Missing parameter [User Id]'));
    }

    if (!deviceId) {
      return response.send(400, new MugError('Missing parameter [Device Id]'));
    }

    Device.findOne(deviceId)
      .populate('user')
      .exec(function (error, device) {

        if (error) {
          var errmsg = new MugError('Error retrieving the device.', error.details);
          logger.error(errmsg);
          return response.send(500, errmsg);
        }

        if (!device) {
          return response.send(404, new MugError('Device not found.', 'Device id = ' + deviceId));
        }

        // just ensure that the device is related to user parameter
        if (userId != device.user.id) {
          return response.send(403, new MugError('This device does not belong to you'));
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
  var message = 'Your MugChat validation code: ' + verificationCode;

  device.verificationCode = verificationCode;
  device.retryCount = 0;
  device.save();

  twilioService.sendSms(device.phoneNumber, message, function (err, message) {
    logger.info(err || message);
  });
};
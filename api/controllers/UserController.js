/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var MAX_RETRY_COUNT = 2;

var UserController = {

  uploadPhoto: function(request, response) {
    var userId = request.params.parentid;
    var photo = request.file('photo');

    if (!userId) {
      return response.send(400, new MugError('Missing parameter: [User Id]'));
    }

    if (!photo || photo._files.length < 1) {
      return response.send(400, new MugError('Missing parameter: [User Photo]'));
    }

    s3service.upload(photo, s3service.PICTURES_BUCKET, function(err, uploadedFiles) {
      if (err) {
        var errmsg = new MugError('Error uploading picture', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }

      if (!uploadedFiles || uploadedFiles.length < 1){
        return response.send(400, new MugError('Error uploading file'));
      }

      var uploadedFile = uploadedFiles[0];

      User.update(userId, { photoUrl: uploadedFile.extra.Location })
        .exec(function(err, updatedUser) {

          if (err) {
            var errmsg = new MugError('Error updating user', err);
            logger.error(errmsg);
            return response.send(500, errmsg);
          }

          if (!updatedUser || updatedUser.length < 1){
            return response.send(400, new MugError('Error updating user with photo url'));
          }

          return response.send(200, updatedUser[0]);
      });
    });
  },

  forgot: function(request, response) {
    var phoneNumber = request.param('phone_number');
    var email = request.param('email');

    if (!phoneNumber || !email) {
      return response.send(400, new MugError('Error requesting to reset password.', 'Phone Number or email is empty.'));
    }

    User.findOne({ username: email })
      .exec(function(err, user) {
        if (err) {
          var errmsg = new MugError('Error retrieving the user.');
          logger.error(errmsg);
          return response.send(500, errmsg);
        }

        if (!user) {
          return response.send(404, new MugError('User not found.', 'username = ' + email));
        }

        Device.findOne({ phoneNumber: phoneNumber })
          .populate('user')
          .exec(function (error, device) {
            if (error) {
              var errmsg = new MugError('Error retrieving the user.');
              logger.error(errmsg);
              return response.send(500, errmsg);
            }

            if (!device) {
              return response.send(404, new MugError('Device not found.', 'device number = ' + phoneNumber));
            }

            if (device.user.id != user.id) {
              return response.send(403, new MugError('This device is not yours.'));
            }

            sendVerificationCode(device);

            return response.json(200, {});

          }
        );
      }
    );
  },

  verify: function (request, response) {
    var phoneNumber = request.param('phone_number');
    var verificationCode = request.param('verification_code');

    if (!phoneNumber || !verificationCode) {
      return response.send(400, new MugError('Error requesting to reset password.', 'Phone Number or verification code is empty.'));
    }

    Device.findOne({ phoneNumber: phoneNumber })
      .populate('user')
      .exec(function (error, device) {
        if (error) {
          var errmsg = new MugError('Error retrieving the user.');
          logger.error(errmsg);
          return response.send(500, errmsg);
        }

        if (!device) {
          return response.send(404, new MugError('Device not found.', 'device number = ' + phoneNumber));
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

  updatePassword: function (request, response) {
    var email = request.param('email');
    var phoneNumber = request.param('phone_number');
    var verificationCode = request.param('verification_code');
    var password = request.param('password');

    if (!email || !phoneNumber || !verificationCode || !password) {
      return response.send(400, new MugError('Error requesting to update password.', 'Missing parameters.'));
    }

    Device.findOne({ phoneNumber: phoneNumber })
      .populate('user')
      .exec(function (error, device) {
        if (error) {
          var errmsg = new MugError('Error retrieving the user.');
          logger.error(errmsg);
          return response.send(500, errmsg);
        }

        if (!device) {
          return response.send(404, new MugError('Device not found.', 'device number = ' + phoneNumber));
        }

        if (device.verificationCode != verificationCode) {
          //if the verification code is wrong, it's probably an attack - so the code should be changed to avoid brute-force update
          var verificationCode = Math.floor(Math.random() * 8999) + 1000;
          device.verificationCode = verificationCode;
          device.save();
          return response.send(400, new MugError('Wrong verification code.'));
        }

        if (device.user.username != email) {
          return response.send(400, new MugError('Wrong username'));
        }

        var PASSWORD_REGEX = '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$';

        if (!password.match(PASSWORD_REGEX)) {
          return response.send(400, new MugError('Password must have at least eight characters, one uppercase letter and one lowercase letter and one number.'));
        }

        Passport.update({user: device.user.id}, {password: password}, function(error, affectedUsers) {
          if (error) {
            var errmsg = new MugError('Error updating passport.');
            logger.error(errmsg);
            return response.send(500, errmsg);
          }

          if (!affectedUsers || affectedUsers.length < 1) {
            return response.send(400, new MugError("No rows affected while updating passport"));
          }

          return response.json(200, {});
        })

      })
  }

};

module.exports = UserController;

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

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
        return response.send(500, new MugError('Error uploading picture', err));  
      }

      if (!uploadedFiles || uploadedFiles.length < 1){
        return response.send(400, new MugError('Error uploading file'));
      }

      var uploadedFile = uploadedFiles[0];

      User.update(userId, { photoUrl: uploadedFile.extra.Location })
        .exec(function(err, updatedUser) {

          if (err) {
            return response.send(500, new MugError('Error updating user', err));
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
          return response.send(500, new MugError('Error retrieving the user.'));
        }

        if (!user) {
          return response.send(404, new MugError('User not found.', 'username = ' + email));
        }

        Device.findOne({ phoneNumber: phoneNumber })
          .populate('user')
          .exec(function (error, device) {
            if (error) {
              return response.send(500, new MugError('Error retrieving the user.'));
            }

            if (!device) {
              return response.send(404, new MugError('Device not found.', 'device number = ' + phoneNumber));
            }

            if (device.user.id != user.id) {
              return response.send(403, new MugError('This device is not yours.'));
            }

            sendVerificationCode(device);

            return response.send(200);

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
          return response.send(500, new MugError('Error retrieving the user.'));
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
    //TODO Change to a better Logger
    console.log(err || message);
  });
};

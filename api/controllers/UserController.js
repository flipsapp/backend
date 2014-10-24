/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var MAX_RETRY_COUNT = 2;
var actionUtil = requires('>/node_modules/sails/lib/hooks/blueprints/actionUtil');
var googl = require('goo.gl');
var uuid = require('node-uuid');

var UserController = {

  uploadPhoto: function(request, response) {
    var userId = request.params.parentid;
    var photo = request.file('photo');

    if (!userId) {
      return response.send(400, new FlipsError('Missing parameter: [User Id]'));
    }

    if (!photo || photo._files.length < 1) {
      return response.send(400, new FlipsError('Missing parameter: [User Photo]'));
    }

    s3service.upload(photo, s3service.PICTURES_BUCKET, function(err, uploadedFiles) {
      if (err) {
        var errmsg = new FlipsError('Error uploading picture', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }

      if (!uploadedFiles || uploadedFiles.length < 1){
        return response.send(400, new FlipsError('Error uploading file'));
      }

      var uploadedFile = uploadedFiles[0];

      User.update(userId, { photoUrl: uploadedFile.extra.Location })
        .exec(function(err, updatedUser) {

          if (err) {
            var errmsg = new FlipsError('Error updating user', err);
            logger.error(errmsg);
            return response.send(500, errmsg);
          }

          if (!updatedUser || updatedUser.length < 1){
            return response.send(400, new FlipsError('Error updating user with photo url'));
          }

          return response.send(200, updatedUser[0]);
      });
    });
  },

  forgot: function(request, response) {
    var phoneNumber = request.param('phone_number');
    var email = request.param('email');

    if (!phoneNumber || !email) {
      return response.send(400, new FlipsError('Error requesting to reset password.', 'Phone Number or email is empty.'));
    }

    User.findOne({ username: email })
      .exec(function(err, user) {
        if (err) {
          var errmsg = new FlipsError('Error retrieving the user.');
          logger.error(errmsg);
          return response.send(500, errmsg);
        }

        if (!user) {
          return response.send(404, new FlipsError('User not found.', 'username = ' + email));
        }

        Device.findOne({ phoneNumber: phoneNumber })
          .populate('user')
          .exec(function (error, device) {
            if (error) {
              var errmsg = new FlipsError('Error retrieving the user.');
              logger.error(errmsg);
              return response.send(500, errmsg);
            }

            if (!device) {
              return response.send(404, new FlipsError('Device not found.', 'device number = ' + phoneNumber));
            }

            if (device.user.id != user.id) {
              return response.send(403, new FlipsError('This device is not yours.'));
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
      return response.send(400, new FlipsError('Error requesting to reset password.', 'Phone Number or verification code is empty.'));
    }

    Device.findOne({ phoneNumber: phoneNumber })
      .populate('user')
      .exec(function (error, device) {
        if (error) {
          var errmsg = new FlipsError('Error retrieving the user.');
          logger.error(errmsg);
          return response.send(500, errmsg);
        }

        if (!device) {
          return response.send(404, new FlipsError('Device not found.', 'device number = ' + phoneNumber));
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
      return response.send(400, new FlipsError('Error requesting to update password.', 'Missing parameters.'));
    }

    Device.findOne({ phoneNumber: phoneNumber })
      .populate('user')
      .exec(function (error, device) {
        if (error) {
          var errmsg = new FlipsError('Error retrieving the user.');
          logger.error(errmsg);
          return response.send(500, errmsg);
        }

        if (!device) {
          return response.send(404, new FlipsError('Device not found.', 'device number = ' + phoneNumber));
        }
        if (device.verificationCode != verificationCode) {
          //if the verification code is wrong, it's probably an attack - so the code should be changed to avoid brute-force update
          var newVerificationCode = Math.floor(Math.random() * 8999) + 1000;
          device.verificationCode = newVerificationCode;
          device.save();
          return response.send(400, new FlipsError('Wrong verification code.'));
        }

        if (device.user.username != email) {
          return response.send(400, new FlipsError('Wrong username'));
        }

        var PASSWORD_REGEX = '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$';

        if (!password.match(PASSWORD_REGEX)) {
          return response.send(400, new FlipsError('Password must have at least eight characters, one uppercase letter and one lowercase letter and one number.'));
        }

        var whereClause = {user: device.user.id}
        var updateColumns = {password: password}
        Passport.update(whereClause, updateColumns, function(error, affectedUsers) {
          if (error) {
            var errmsg = new FlipsError('Error updating passport.');
            logger.error(errmsg);
            return response.send(500, errmsg);
          }

          if (!affectedUsers || affectedUsers.length < 1) {
            return response.send(400, new FlipsError("No rows affected while updating passport"));
          }

          return response.json(200, {});
        })

      })
  },

  inviteContacts: function (request, response) {
    var values = actionUtil.parseValues(request);
    var userId = values.parentid;
    var contacts = values.contacts;

    User.findOne(userId).exec(function (err, user) {
      if (err) {
        return response.send(500, new FlipsError('Error trying to find user', err));
      }
      if (!user) {
        return response.send(404, new FlipsError('User not found'));
      }
      for (var i=0; i < contacts.length; i++) {
        contacts[i].user = user;
      }
      async.concat(contacts, inviteContact, function(err, invitedContacts) {
        return response.send(200, invitedContacts);
      })
    });
  }

};

module.exports = UserController;

var sendVerificationCode = function(device) {
  var verificationCode = Math.floor(Math.random() * 8999) + 1000;
  var message = 'Your Flips verification code: ' + verificationCode;

  device.verificationCode = verificationCode;
  device.retryCount = 0;
  device.save();

  twilioService.sendSms(device.phoneNumber, message, function (err, message) {
    logger.info(err || message);
  });
};

var inviteContact = function(contact, callback) {
  var code = uuid() + uuid(); // generate a unique invitation code
  Invitation.findOne({phoneNumber: contact.phoneNumber, invitedBy: contact.user.id}).exec(function(err, invitation) {
    if (!err && !invitation) {
      Invitation.create({code: code, phoneNumber: contact.phoneNumber, invitedBy: contact.user.id}).exec(function(err, newInvitation) {
        if (newInvitation) {
          sendInvitationBySMS(newInvitation.code, contact.phoneNumber, contact.user, function(err, number) {
            callback(err, number);
          });
        }
      });
    }
  });
};

var sendInvitationBySMS = function(invitationCode, toNumber, fromUser, callback) {
  var url = 'https://' + request.get('host') + '/clickedInvitation/' + invitationCode;
  googl.shorten(url)
    .then(function (shortenURL) {
      var msg ="You've been Flipped by {{firstname}} {{lastname}}! Download Flips within 30 days to view your message.  {{url}}";
      msg = msg.replace("{{firstname}}", fromUser.firstName);
      msg = msg.replace("{{lastname}}", fromUser.lastName);
      msg = msg.replace("{{url}}", shortenURL);
      console.log(msg);
      (function (number) {
        twilioService.sendSms(number, msg, function (err, message) {
          callback(err, number);
        });
      })(toNumber);
    })
    .catch(function (err) {
      callback(err);
    });

}

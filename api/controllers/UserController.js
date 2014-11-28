/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var MAX_RETRY_COUNT = 2;
var actionUtil = requires('>/node_modules/sails/lib/hooks/blueprints/actionUtil');
var Krypto = requires('>/api/utilities/Krypto');

var UserController = {

  uploadPhoto: function (request, response) {
    var userId = request.params.parentid;
    var photo = request.file('photo');

    if (!userId) {
      return response.send(400, new FlipsError('Missing parameter: [User Id]'));
    }

    if (!photo || photo._files.length < 1) {
      return response.send(400, new FlipsError('Missing parameter: [User Photo]'));
    }

    s3service.upload(photo, s3service.PICTURES_BUCKET, function (err, uploadedFiles) {
      if (err) {
        var errmsg = new FlipsError('Error uploading picture', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }

      if (!uploadedFiles || uploadedFiles.length < 1) {
        return response.send(400, new FlipsError('Error uploading file'));
      }

      var uploadedFile = uploadedFiles[0];

      User.update(userId, {photoUrl: s3service.S3_URL + s3service.PICTURES_BUCKET + '/' + uploadedFile.fd})
        .exec(function (err, updatedUser) {

          if (err) {
            var errmsg = new FlipsError('Error updating user', err);
            logger.error(errmsg);
            return response.send(500, errmsg);
          }

          if (!updatedUser || updatedUser.length < 1) {
            return response.send(400, new FlipsError('Error updating user with photo url'));
          }

          return response.send(200, Krypto.decryptUser(updatedUser[0]));
        });
    });
  },

  forgot: function (request, response) {
    var phoneNumber = request.param('phone_number');

    if (!phoneNumber) {
      return response.send(400, new FlipsError('Error requesting to reset password.', 'Phone Number is empty.'));
    }

    User.findOne({phoneNumber: Krypto.encrypt(phoneNumber)})
      .exec(function (err, user) {
        if (err) {
          var errmsg = new FlipsError('Error retrieving the user.');
          logger.error(errmsg);
          return response.send(500, errmsg);
        }

        if (!user) {
          return response.send(404, new FlipsError('User not found.'));
        }

        Device.findOne({user: user.id})
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

    User.findOne({phoneNumber: Krypto.encrypt(phoneNumber)}).exec(function (err, user) {
      if (err) {
        return response.send(500, new FlipsError('Error retrieving user'));
      }
      if (!user) {
        return response.send(404, new FlipsError('User not found'));
      }
      Device.findOne({user: user.id})
        .populate('user')
        .exec(function (error, device) {
          if (error) {
            var errmsg = new FlipsError('Error retrieving device');
            logger.error(errmsg);
            return response.send(500, errmsg);
          }
          if (!device) {
            return response.send(404, new FlipsError('Device not found'));
          }
          if (device.verificationCode != verificationCode) {
            device.retryCount++;
            device.isVerified = false;

            if (device.retryCount > MAX_RETRY_COUNT) {
              sendVerificationCode(device);
            }

            device.save();
            return response.send(400, new FlipsError('Wrong validation code'));
          }

          device.isVerified = true;
          device.retryCount = 0;
          device.save();

          device.user = Krypto.decryptUser(device.user);

          return response.send(200, device);

        }
      );
    });
  },

  updatePassword: function (request, response) {
    var email = request.param('email');
    var phoneNumber = request.param('phone_number');
    var verificationCode = request.param('verification_code');
    var password = request.param('password');

    if (!email || !phoneNumber || !verificationCode || !password) {
      return response.send(400, new FlipsError('Error requesting to update password.', 'Missing parameters.'));
    }

    User.findOne({
      username: Krypto.encrypt(email),
      phoneNumber: Krypto.encrypt(phoneNumber)
    }).exec(function (err, user) {
      if (err) {
        return response.send(500, new FlipsError('Error trying to retrieve user'));
      }
      if (!user) {
        return response.send(404, new FlipsError('Username and/or phone number do not match any user'));
      }
      Device.findOne({user: user.id})
        .populate('user')
        .exec(function (error, device) {
          if (error) {
            var errmsg = new FlipsError('Error when trying to retrieve device info');
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

          device.user = Krypto.decryptUser(device.user);

          var PASSWORD_REGEX = '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$';

          if (!password.match(PASSWORD_REGEX)) {
            return response.send(400, new FlipsError('Password must have at least eight characters, one uppercase letter and one lowercase letter and one number.'));
          }

          var whereClause = {user: device.user.id}
          var updateColumns = {password: password}
          Passport.update(whereClause, updateColumns, function (error, affectedUsers) {
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
    });

  },

  myRooms: function (request, response) {
    var userId = request.params.parentid;
    Room.query('select a.* from room a, participant b where a.id = b.room and b.user = ' + userId, function (err, rooms) {
      if (err) {
        return response.send(500, new FlipsError('Error when trying to retrieve rooms'));
      }
      if (!rooms) {
        return reponse.send(404, new FlipsError('Rooms not found'))
      }
      populateRooms(rooms, function (err, populatedRooms) {
        if (err) {
          return response.send(500, new FlipsError('Error when trying to retrieve rooms'));
        }
        return response.send(200, populatedRooms);
      });
    });
  },

  verifyContacts: function (request, response) {
    var validatedUsers = new Array();
    var contacts = request.param("phoneNumbers");
    for (var i = 0; i < contacts.length; i++) {
      contacts[i] = Krypto.encrypt(contacts[i]);
    }
    User.find()
      .where({phoneNumber: contacts})
      .exec(function (err, users) {
        for (var i = 0; i < users.length; i++) {
          var decryptedUser = Krypto.decryptUser(users[i]);
          validatedUsers[i] = {
            id: decryptedUser.id,
            firstName: decryptedUser.firstName,
            lastName: decryptedUser.lastName,
            phoneNumber: decryptedUser.phoneNumber,
            birthday: decryptedUser.birthday,
            photoUrl: decryptedUser.photoUrl
          }
        }
        return response.send(200, validatedUsers);
      })
  },

  verifyFacebookUsers: function (request, response) {
    var validatedUsers = new Array();
    var facebookIDs = request.param("facebookIDs");
    for (var i = 0; i < facebookIDs.length; i++) {
      facebookIDs[i] = Krypto.encrypt(facebookIDs[i]);
    }

    User.find()
      .where({ facebookID: facebookIDs })
      .exec(function (err, users) {
        for (var i = 0; i < users.length; i++) {
          var decryptedUser = Krypto.decryptUser(users[i]);
          validatedUsers[i] = {
            id: decryptedUser.id,
            firstName: decryptedUser.firstName,
            lastName: decryptedUser.lastName,
            phoneNumber: decryptedUser.phoneNumber,
            birthday: decryptedUser.birthday,
            photoUrl: decryptedUser.photoUrl,
            facebookID: decryptedUser.facebookID
          }
        }
        return response.send(200, validatedUsers);
      })
  },

  update: function (request, response) {
    var userId = request.params.parentid;
    var updatedValues = actionUtil.parseValues(request);
    var photo = request.file('photo');

    if (!userId) {
      return response.send(400, new FlipsError('Missing parameter: [User Id]'));
    }

    var PASSWORD_REGEX = '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$';
    var password = updatedValues.password;

    if (password && !password.match(PASSWORD_REGEX)) {
      return response.send(400, new FlipsError('Password must have at least eight characters, one uppercase letter and one lowercase letter and one number.'));
    }

    User.findOne(userId).exec(function (err, user) {
      if (err) {
        return response.send(500, new FlipsError('Error when trying to retrieve user'));
      }
      if (!user) {
        return response.send(404, new FlipsError('User not found'));
      }
      if (updatedValues.firstName) {
        user.firstName = Krypto.encrypt(updatedValues.firstName);
      }
      if (updatedValues.lastName) {
        user.lastName = Krypto.encrypt(updatedValues.lastName);
      }
      if (updatedValues.username) {
        user.username = Krypto.encrypt(updatedValues.username);
      }
      if (updatedValues.phoneNumber) {
        user.phoneNumber = Krypto.encrypt(updatedValues.phoneNumber);
      }
      if (updatedValues.nickname) {
        user.nickname = Krypto.encrypt(updatedValues.nickname);
      }
      user.save(function (err) {
        if (err) {
          var errmsg = new FlipsError('Error trying to update user');
          logger.error(errmsg, err);
          return response.send(500, errmsg);
        }

        if (password) {
          var whereClause = {user: user.id}
          var updateColumns = {password: password}
          Passport.update(whereClause, updateColumns, function (error, affectedUsers) {
            if (error) {
              var errmsg = new FlipsError('Error updating passport.');
              logger.error(errmsg);
              return response.send(500, errmsg);
            }

            if (!affectedUsers || affectedUsers.length < 1) {
              return response.send(400, new FlipsError("No rows affected while updating passport"));
            }

            if (photo && photo._files.length >= 1) {
              s3service.upload(photo, s3service.PICTURES_BUCKET, function (err, uploadedFiles) {
                if (err) {
                  var errmsg = new FlipsError('Error uploading picture', err);
                  logger.error(errmsg);
                  return response.send(500, errmsg);
                }

                if (!uploadedFiles || uploadedFiles.length < 1) {
                  return response.send(400, new FlipsError('Error uploading file'));
                }

                var uploadedFile = uploadedFiles[0];

                user.photoUrl = s3service.S3_URL + s3service.PICTURES_BUCKET + '/' + uploadedFile.fd;
                user.save(function (err) {
                  if (err) {
                    var errmsg = new FlipsError('Error updating user', err);
                    logger.error(errmsg);
                    return response.send(500, errmsg);
                  }
                  return response.send(200, Krypto.decryptUser(user));
                });
              });
            } else {
              return response.send(200, Krypto.decryptUser(user));
            }

          });
        } else {

          if (photo && photo._files.length >= 1) {
            s3service.upload(photo, s3service.PICTURES_BUCKET, function (err, uploadedFiles) {
              if (err) {
                var errmsg = new FlipsError('Error uploading picture', err);
                logger.error(errmsg);
                return response.send(500, errmsg);
              }

              if (!uploadedFiles || uploadedFiles.length < 1) {
                return response.send(400, new FlipsError('Error uploading file'));
              }

              var uploadedFile = uploadedFiles[0];

              user.photoUrl = s3service.S3_URL + s3service.PICTURES_BUCKET + '/' + uploadedFile.fd;
              user.save(function (err) {
                if (err) {
                  var errmsg = new FlipsError('Error updating user', err);
                  logger.error(errmsg);
                  return response.send(500, errmsg);
                }
                return response.send(200, Krypto.decryptUser(user));
              });
            });
          } else {
            return response.send(200, Krypto.decryptUser(user));
          }

        }

      });
    });

  },

  findById: function (request, response) {
    var userId = request.params.parentid;
    User.findOne(userId).exec(function (err, user) {
      if (err) {
        return response.send(500, new FlipsError('Error retrieving user'));
      }
      if (!user) {
        return response.send(404, new FlipsError('User not found'));
      }
      return response.send(200, Krypto.decryptUser(user));
    });
  },

  printUsers: function (request, response) {
    User.find().exec(function (err, users) {
      Krypto.decryptUsers(users, function (err, decUsers) {
        response.send(200, decUsers);
      })
    });
  }

};

var sendVerificationCode = function (device) {
  var verificationCode = Math.floor(Math.random() * 8999) + 1000;
  var message = 'Your Flips verification code: ' + verificationCode;

  device.verificationCode = verificationCode;
  device.retryCount = 0;
  device.save();

  twilioService.sendSms(Krypto.decrypt(device.user.phoneNumber), message, function (err, message) {
    logger.info(err || message);
  });
};

var getParticipantsForRoom = function (roomId, callback) {
  Participant.find({room: roomId}).exec(function (err, participants) {
    if (err) {
      callback([]);
    } else {
      callback(participants);
    }
  });
};

var populateRooms = function (rooms, callback) {
  async.map(
    rooms,
    function (aRoom, transformedCallback) {
      getParticipantsForRoom(aRoom.id, function (participants) {
        var participantIds = [];
        for (var i = 0; i < participants.length; i++) {
          participantIds.push(participants[i].user);
        }
        User.find({id: participantIds}).exec(function (err, users) {
          if (err) {
            transformedCallback(null, []);
          } else {
            Krypto.decryptUsers(users, function (err, decryptedUsers) {
              if (err) {
                callback(null, []);
              } else {
                aRoom.participants = decryptedUsers;
                transformedCallback(null, removeUnwantedPropertiesFromUsers(aRoom));
              }
            });
          }
        });
      })
    },
    function (err, populatedRooms) {
      callback(err, populatedRooms);
    });
};

var removeUnwantedPropertiesFromUsers = function (aRoom) {
  var room = {
    id: aRoom.id,
    admin: aRoom.admin,
    name: aRoom.name,
    pubnubId: aRoom.pubnubId,
    createdAt: aRoom.createdAt,
    updatedAt: aRoom.updatedAt
  };
  var participants = [];
  for (var i = 0; i < aRoom.participants.length; i++) {
    var participant = {
      id: aRoom.participants[i].id,
      username: aRoom.participants[i].username,
      firstName: aRoom.participants[i].firstName,
      lastName: aRoom.participants[i].lastName,
      birthday: aRoom.participants[i].birthday,
      facebookId: aRoom.participants[i].facebookId,
      photoUrl: aRoom.participants[i].photoUrl,
      nickname: aRoom.participants[i].nickname,
      phoneNumber: aRoom.participants[i].phoneNumber,
      isTemporary: aRoom.participants[i].isTemporary,
      createdAt: aRoom.participants[i].createdAt,
      updatedAt: aRoom.participants[i].updatedAt
    };
    participants.push(participant);
  }
  room.participants = participants;
  return room;
};

module.exports = UserController;
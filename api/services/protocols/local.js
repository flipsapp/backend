var validator = require('validator')
  , actionUtil = requires('>/node_modules/sails/lib/hooks/blueprints/actionUtil')
  , moment = require('moment')
  , uuid = require('node-uuid')
  , Krypto = requires('>/api/utilities/Krypto');

/**
 * Local Authentication Protocol
 *
 * The most widely used way for websites to authenticate users is via a username
 * and/or email as well as a password. This module provides functions both for
 * registering entirely new users, assigning passwords to already registered
 * users and validating login requesting.
 *
 * For more information on local authentication in Passport.js, check out:
 * http://passportjs.org/guide/username-password/
 */

/**
 * Register a new user
 *
 * This method creates a new user from a specified email, username and password
 * and assign the newly created user a local Passport.
 *
 * @param {Object}   req
 * @param {Object}   res
 * @param {Function} next
 */

var MINIMAL_AGE = 13;

// at least 8 characters
// at least 1 uppercase
// at least 1 lowercase
// at least 1 number
var PASSWORD_REGEX = '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$';

exports.register = function (request, response, next) {
  var photo = request.file('photo');
  var userModel = actionUtil.parseValues(request);
  userModel.photo = photo;

  if (!userModel.username) {
    if (userModel.facebookID) {
      return next('No email was entered.');
    } else {
      return next('No username was entered.');
    }
  }

  var password = userModel.password;

  if (!password && !userModel.facebookID) {
    return next('No password was entered.');
  }
  if (!password.match(PASSWORD_REGEX) && !userModel.facebookID) {
    return next('Password must have at least eight characters, one uppercase letter and one lowercase letter and one number.');
  }

  return this.createUser(userModel, next);
};

/**
 * Validate a login request
 *
 * Looks up a user using the supplied identifier (email or username) and then
 * attempts to find a local Passport associated with the user. If a Passport is
 * found, its password is checked against the password supplied in the form.
 *
 * @param {Object}   req
 * @param {string}   identifier
 * @param {string}   password
 * @param {Function} next
 */
exports.login = function (req, identifier, password, next) {
  var query = {};
  query.username = Krypto.encrypt(identifier);

  User.findOne(query)
    .populate('devices')
    .exec(function (err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        logger.error('Error.Passport.Username.NotFound');
        req.flash('error', 'Error.Passport.Username.NotFound');
        return next(null, false);
      }

      Passport.findOne({
        protocol: 'local',
        user: user.id
      }, function (err, passport) {
        if (passport) {
          passport.validatePassword(password, function (err, res) {
            if (err) {
              return next(err);
            }

            if (!res) {
              logger.error('Error.Passport.Password.Wrong');
              req.flash('error', 'Error.Passport.Password.Wrong');
              return next(null, false);
            } else {
              return next(null, user);
            }
          });
        }
        else {
          logger.error('Error.Passport.Password.NotSet');
          req.flash('error', 'Error.Passport.Password.NotSet');
          return next(null, false);
        }
      });
    });
};

exports.createUser = function (userModel, next) {
  logger.debug('entered createUser()');
  var photo = userModel.photo;
  delete userModel.photo;

  checkAge(userModel, function (ageErr, age) {
    logger.debug('entered block of check age');
    if (ageErr) {
      logger.error(ageErr);
      return next(ageErr);
    }
    checkExistingUser(userModel, function (existingUserErr, existingUsers) {
      logger.debug('entered block of checkExistingUser()');
      if (existingUsers) {
        logger.debug('existing users');

        logger.debug(existingUsers);

        var activeUser = getActiveUser(existingUsers);
        var tempUser = getTempUser(existingUsers);

        logger.debug('activeUser');
        logger.debug(activeUser);
        logger.debug('tempUser');
        logger.debug(tempUser);

        if (activeUser) {

          logger.debug('active user');

          // has the same username?
          if (activeUser.username === Krypto.encrypt(userModel.username)) {
            return next('An account already exists for that email address.  Log in or sign up with a different address.');
          }

          // has the same phone number?
          if (activeUser.phoneNumber === Krypto.encrypt(userModel.phoneNumber)) {
            return next('This phone number is already used by an existing Flips user.');
          }
        }
        if (tempUser) {
          // temporary user (just created or invited user)

          // update user info using the new values
          logger.debug('replacing existing user information');

          if (userModel.username) {
            tempUser.username = Krypto.encrypt(userModel.username);
          }
          if (userModel.firstName) {
            tempUser.firstName = Krypto.encrypt(userModel.firstName);
          }
          if (userModel.lastName) {
            tempUser.lastName = Krypto.encrypt(userModel.lastName);
          }
          if (userModel.phoneNumber) {
            tempUser.phoneNumber = Krypto.encrypt(userModel.phoneNumber);
          }
          if (userModel.nickname) {
            tempUser.nickname = Krypto.encrypt(userModel.nickname);
          }
          tempUser.birthday = userModel.birthday;

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
              tempUser.photoUrl = s3service.S3_URL + s3service.PICTURES_BUCKET + '/' + uploadedFile.fd;
              tempUser.save();
            });
          }

          tempUser.save(function (err) {
            if (err) {
              logger.debug(err);
              logger.error(err);
              return next('It was not possible to sign up this user');
            }

            User.findOne(tempUser.id).exec(function(error, user) {
              if (error || !user) {
                logger.debug('It was not possible to sign up this user');
                return next('It was not possible to sign up this user');
              }
              logger.debug('ok... temp user saved');
              return next(null, Krypto.decryptUser(user));

            });
          });
        }

      } else {
        logger.debug('1. insert user');
        return insertUser(userModel, photo, next);
      }
    });
  });
};

var checkAge = function (userModel, callback) {
  logger.debug('checking age');
  try {
    var birthday = moment(userModel.birthday, "YYYY/MM/DD");
    var now = moment();
    var difference = now.diff(birthday, 'years');

    if (difference < MINIMAL_AGE) {
      return callback('You must have at least 13 years old.', null);
    }

    return callback(null, userModel);
  } catch (err) {
    return callback(err);
  }
};

var checkExistingUser = function (userModel, callback) {
  User.find({
    or: [
      {username: Krypto.encrypt(userModel.username)},
      {phoneNumber: Krypto.encrypt(userModel.phoneNumber)}
    ]
  }).exec(function (err, usersWithSameUsernameOrPhoneNumber) {
    if (usersWithSameUsernameOrPhoneNumber && usersWithSameUsernameOrPhoneNumber.length > 0) {
      logger.debug('user with same username or phone number');
      return callback('An account already exists for that email address or phone number.  Log in or sign up again with different information.', usersWithSameUsernameOrPhoneNumber);
    } else {
      logger.debug('no same phone number, no same username');
      return callback(null, null);
    }

  });
};

var getActiveUser = function (users) {
  for (var i = 0; i < users.length; i++) {
    if (!users[i].isTemporary) {
      return users[i];
    }
  }
  return null;
};

var getTempUser = function(users) {
  for (var i = 0; i < users.length; i++) {
    if (users[i].isTemporary) {
      return users[i];
    }
  }
  return null;
};


var insertUser = function (userModel, photo, next) {
  logger.debug('entered into insert user');
  User.create(userModel).exec(function (err, user) {
    if (err) {
      logger.error(err);
      return next(err);
    }
    logger.debug('2. user created');
    return createPassportAndInitialRoom(user, userModel.password, photo, next);
  });
};

var createPassportAndInitialRoom = function (user, password, photo, next) {
  logger.debug('2.1 user: ' + user.id);
  Passport.create({
    protocol: 'local', password: password, user: user.id
  }, function (passportError, passport) {
    if (passportError) {
      logger.error(passportError);
      if (passportError.code === 'E_VALIDATION') {
        logger.error('Error.Passport.Password.Invalid');
        return request.flash('error', 'Error.Passport.Password.Invalid');
      }

      return user.destroy(function (destroyErr) {
        next(destroyErr || passportError);
      });
    }
    logger.debug('3. passport created');

    User.findOne({username: Krypto.encrypt(process.env.FLIPBOYS_USERNAME)}).exec(function (flipBoysErr, flipboysUser) {
      if (flipBoysErr) {
        logger.error(flipBoysErr);
        return user.destroy(function (destroyErr) {
          next(destroyErr || flipBoysErr);
        });
      }
      if (!flipboysUser) {
        return user.destroy(function (destroyErr) {
          next(destroyErr || new FlipsError('Flipboys user not found'));
        });
      }

      logger.debug('4. Flipboys user found');
      logger.debug('5. user id: ' + user.id);
      logger.debug('6. flipboys id: ' + flipboysUser.id);
      //var participants = [];
      //participants.push(user.id);
      //participants.push(flipboysUser.id);

      Room.create({
        admin: user.id,
        pubnubId: uuid()
      }).exec(function (roomErr, room) {
        if (roomErr) {
          logger.error('DB Error when creating room: ' + roomErr);
          return user.destroy(function (destroyErr) {
            next(destroyErr || new FlipsError('Error trying to create Flipboys room for this user', roomErr, ErrorCodes.ROOM_CREATION_INTERNAL_SERVER_ERROR));
          });
        }
        if (!room) {
          logger.error('Room not found');
          return user.destroy(function (destroyErr) {
            next(destroyErr || new FlipsError('No Flipboys room created for this user.', null, ErrorCodes.ROOM_CREATION_BAD_REQUEST_ERROR));
          });
        }

        logger.debug('room was created with id: ' + room.id);

        Participant.create({user: user.id, room: room.id}).exec(function (err, userParticipant) {
          if (err) {
            logger.error('Error creating user participation in room: ' + err);
            return user.destroy(function (destroyErr) {
              next(destroyErr || new FlipsError('Error trying to add user to a room'));
            });
          }
          Participant.create({user: flipboysUser.id, room: room.id}).exec(function (err, flipBoysParticipant) {
            if (err) {
              logger.error('Error creating flipboys  participation in room: ' + err);
              return user.destroy(function (destroyErr) {
                next(destroyErr || new FlipsError('Error trying to add user to a room'));
              });
            }
            logger.debug('8. room created' + room);

            User.findOne(user.id).exec(function (populatedUserErr, populatedUser) {
              logger.debug('8.3 populatedUser: ' + populatedUser.username);
              if (populatedUserErr) {
                return user.destroy(function (destroyErr) {
                  next(destroyErr || new FlipsError('Error trying the newly created user', populatedUserErr, ErrorCodes.USER_FIND_INTERNAL_ERROR));
                });
              }

              logger.debug('9. populated user: ' + populatedUser.username);

              logger.debug('9.1 sending welcome message');
              PubnubGateway.publishWelcomeMessage(room);

              if (photo && photo._files.length > 0) {
                logger.debug('9.1 files length: ' + photo._files.length);
                s3service.upload(photo, s3service.PICTURES_BUCKET, function (s3Err, uploadedFiles) {
                  if (s3Err) {
                    logger.error(s3Err);
                    var errmsg = 'Error uploading picture to S3';
                    logger.error(errmsg);
                    return user.destroy(function (destroyErr) {
                      next(destroyErr || errmsg);
                    });
                  }

                  logger.debug('10. no error on upload picture');

                  if (!uploadedFiles || uploadedFiles.length < 1) {
                    logger.error('No files uploaded');
                    return user.destroy(function (destroyErr) {
                      next(destroyErr || 'No files uploaded');
                    });
                  }

                  logger.debug('11. one or more pictures uploaded');
                  logger.debug('11.1 populatedUser: ' + populatedUser.username);

                  var uploadedFile = uploadedFiles[0];

                  logger.debug('11.2 file location: ' + 'https://s3.amazonaws.com/' + s3service.PICTURES_BUCKET + '/' + uploadedFile.fd);

                  populatedUser.photoUrl = s3service.S3_URL + s3service.PICTURES_BUCKET + '/' + uploadedFile.fd;
                  populatedUser.save(function (saveErr) {
                    if (saveErr) {
                      logger.error('DB Error when trying to save user: ' + saveErr);
                      return user.destroy(function (destroyErr) {
                        next(destroyErr || 'DB Error when trying to save user');
                      });
                    }
                    logger.debug('12. user saved with thumbnail url');
                    logger.debug('13. populatedUser: ' + populatedUser.username);
                    Room.query('select a.* from room a, participant b where a.id = b.room and b.user = ' + populatedUser.id, function (err, rooms) {
                      if (err) {
                        rooms = [];
                      }
                      populatedUser.rooms = rooms;
                      return next(null, Krypto.decryptUser(populatedUser));
                    });

                  });

                });
              } else {
                logger.debug('populatedUser: ' + populatedUser.username);
                return next(null, Krypto.decryptUser(populatedUser));
              }

            });
          });
        });

      });
    });
  });
};

var validator = require('validator')
  , actionUtil = requires('>/node_modules/sails/lib/hooks/blueprints/actionUtil')
  , moment    = require('moment')
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
    return next('No username was entered.');
  }

  var password = userModel.password;

  if (!password) {
    return next('No password was entered.');
  }
  if (!password.match(PASSWORD_REGEX)) {
    return next('Password must have at least eight characters, one uppercase letter and one lowercase letter and one number.');
  }

  this.createUser(userModel, next);
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
        req.flash('error', 'Error.Passport.Username.NotFound');
        return next(null, false);
      }

      Passport.findOne({
        protocol : 'local',
        user     : user.id
      }, function (err, passport) {
        if (passport) {
          passport.validatePassword(password, function (err, res) {
            if (err) {
              return next(err);
            }

            if (!res) {
              req.flash('error', 'Error.Passport.Password.Wrong');
              return next(null, false);
            } else {
              return next(null, user);
            }
          });
        }
        else {
          req.flash('error', 'Error.Passport.Password.NotSet');
          return next(null, false);
        }
      });
  });
};

exports.createUser = function(userModel, next) {
  var photo = userModel.photo;
  delete userModel.photo;
  checkAge(userModel, function (err, age) {

    if (err) {
      return next(err);
    }

    User.create(userModel, function (err, user) {
      if (err) {
        return next(err);
      }

      Passport.create({
        protocol: 'local', password: userModel.password, user: user.id
      }, function (err, passport) {
        if (err) {
          if (err.code === 'E_VALIDATION') {
            request.flash('error', 'Error.Passport.Password.Invalid');
          }

          return user.destroy(function (destroyErr) {
            next(destroyErr || err);
          });
        }

        User.findOne({username: Krypto.encrypt(process.env.FLIPBOYS_USERNAME)}).exec(function(err, flipboysUser) {
          if (err) {
            return user.destroy(function (destroyErr) {
              next(destroyErr || err);
            });
          }
          if (!flipboysUser) {
            return user.destroy(function (destroyErr) {
              next(destroyErr || new FlipsError('Flipboys user not found'));
            });
          }

          var participants = [user.id, flipboysUser.id];

          Room.create({
            admin: user.id,
            participants: participants,
            pubnubId: uuid()
          }).exec(function(err, room) {
            if (err) {
              return user.destroy(function (destroyErr) {
                next(destroyErr || new FlipsError('Error trying to create Flipboys room for this user', err, ErrorCodes.ROOM_CREATION_INTERNAL_SERVER_ERROR));
              });
            }
            if (!room) {
              return user.destroy(function (destroyErr) {
                next(destroyErr || new FlipsError('No Flipboys room created for this user.', null, ErrorCodes.ROOM_CREATION_BAD_REQUEST_ERROR));
              });
            }

            User.findOne(user.id).populate('rooms').exec(function(err, populatedUser) {
              if (err) {
                return user.destroy(function (destroyErr) {
                  next(destroyErr || new FlipsError('Error trying the newly created user', err, ErrorCodes.USER_FIND_INTERNAL_ERROR));
                });
              }
              if (!room) {
                return user.destroy(function (destroyErr) {
                  next(destroyErr || new FlipsError('Error trying to create Flipboys room for this user', err, ErrorCodes.USER_NOT_FOUND));
                });
              }

              if (photo && photo._files.length > 0) {
                s3service.upload(photo, s3service.PICTURES_BUCKET, function (err, uploadedFiles) {
                  if (err) {
                    var errmsg = 'Error uploading picture';
                    logger.error(errmsg);
                    return user.destroy(function (destroyErr) {
                      next(destroyErr || errmsg);
                    });
                  }

                  if (!uploadedFiles || uploadedFiles.length < 1) {
                    return user.destroy(function (destroyErr) {
                      next(destroyErr || errmsg);
                    });
                  }

                  var uploadedFile = uploadedFiles[0];

                  populatedUser.photoUrl = uploadedFile.extra.Location;
                  populatedUser.save();

                  return next(null, populatedUser);

                });
              } else {
                return next(null, populatedUser);
              }

            });
          });
        });
      });
    });
  });
};

var checkAge = function(userModel, callback) {
  try {
    var birthday = moment(userModel.birthday, "YYYY/MM/DD");
    var now = moment();
    var difference = now.diff(birthday, 'years');

    if (difference < MINIMAL_AGE) {
      callback('You must have at least 13 years old.', null);
    }

    callback(null, userModel);
  } catch (err) {
    callback(err);
  }
};
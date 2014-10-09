var validator = require('validator')
  , actionUtil = requires('>/node_modules/sails/lib/hooks/blueprints/actionUtil')
  , moment    = require('moment');

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
  var userModel = actionUtil.parseValues(request);

  if (!userModel.username) {
    request.flash('error', 'Error.Passport.Username.Missing');
    return next('No username was entered.');
  }

  var password = userModel.password;

  if (!password) {
    request.flash('error', 'Error.Passport.Password.Missing');
    return next('No password was entered.');
  }
  if (!password.match(PASSWORD_REGEX)) {
    request.flash('error', 'Error.Passport.Password.Missing');
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
  query.username = identifier;

  User.findOne(query, function (err, user) {
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
  checkAge(userModel, function(err, age) {

    if (err) {
      return next(err);
    }

    User.create(userModel, function (err, user) {
      if (err) {
        return next(err);
      }

      Passport.create({
        protocol : 'local',
        password : userModel.password,
        user     : user.id
      }, function (err, passport) {
        if (err) {
          if (err.code === 'E_VALIDATION') {
            request.flash('error', 'Error.Passport.Password.Invalid');
          }

          return user.destroy(function (destroyErr) {
            next(destroyErr || err);
          });
        }

        return next(null, user);
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
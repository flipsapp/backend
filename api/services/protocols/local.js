var validator = require('validator')
  , actionUtil = requires('>/node_modules/sails/lib/hooks/blueprints/actionUtil');

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
exports.register = function (request, response, next) {
  var userModel = actionUtil.parseValues(request);

  if (!userModel.username) {
    request.flash('error', 'Error.Passport.Username.Missing');
    return next(new Error('No username was entered.'));
  }

  if (!userModel.password) {
    request.flash('error', 'Error.Passport.Password.Missing');
    return next(new Error('No password was entered.'));
  }

  createUser(userModel, next);
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
      protocol : 'local'
    , user     : user.id
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
  User.create(userModel, function (err, user) {
    if (err) {
      if (err.code === 'E_VALIDATION') {
        if (err.invalidAttributes.email) {
          request.flash('error', 'Error.Passport.Email.Exists');
        } else {
          request.flash('error', 'Error.Passport.User.Exists');
        }
      }

      return next(err);
    }

    Passport.create({
      protocol : 'local'
      , password : userModel.password
      , user     : user.id
    }, function (err, passport) {
      if (err) {
        if (err.code === 'E_VALIDATION') {
          request.flash('error', 'Error.Passport.Password.Invalid');
        }

        return user.destroy(function (destroyErr) {
          next(destroyErr || err);
        });
      }

      next(null, user);
    });
  });
};
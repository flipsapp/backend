/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */

var jwt = require('jwt-simple');
var authConfig = requires('>/config/application/auth-config');

module.exports = function (request, response, next) {

  var token = request.headers[authConfig.access_token];

  if (token) {
    var decoded = null;

    try {
      decoded = jwt.decode(token, authConfig.jwt_secret);
      User.findOne({
        username: decoded.username
      }).exec(function (err, user) {
        if (err) {
          return response.serverError('Error retrieving user in isAuthenticated', err.details);
        }

        if (!user) {
          return response.badRequest('Your authentication is not valid. No user was found in database.');
        }

        if (user) {
          request.session.user = user;
        }
        next();
      });
    } catch (err) {
      return response.forbidden('Your authentication is not valid');
    }
  } else {
    return response.forbidden('You are not permitted to perform this action.');
  }

};
/**
 * Authentication Controller
 *
 * This is merely meant as an example of how your Authentication controller
 * should look. It currently includes the minimum amount of functionality for
 * the basics of Passport.js to work.
 */
var AuthController = {

  /**
   * Create a third-party authentication endpoint
   *
   * @param {Object} request
   * @param {Object} response
   */
  provider: function (request, response) {
    passport.endpoint(request, response);
  },

  /**
   * Create a authentication callback endpoint
   *
   * This endpoint handles everything related to creating and verifying Pass-
   * ports and users, both locally and from third-aprty providers.
   *
   * Passport exposes a login() function on req (also aliased as logIn()) that
   * can be used to establish a login session. When the login operation
   * completes, user will be assigned to req.user.
   *
   * For more information on logging in users in Passport.js, check out:
   * http://passportjs.org/guide/login/
   *
   * @param {Object} request
   * @param {Object} response
   */
  callback: function (request, response) {

    // check protocols/local.js#register
    passport.callback(request, response, function (err, user) {
      if (err) {
        return response.serverError(JSON.stringify(err));
      }

      request.login(user, function (loginErr) {
        if (loginErr) {
          return response.badRequest(loginErr);
        }

       return response.ok(user);
      });
    });
  },

  signin: function(request, response) {
    var username = request.body.username;
    var password = request.body.password;

    if (!username || !password) {
      return response.badRequest({error: 'Username/Password is empty.'});
    }

    passport.signin(request, response, function(err, user) {

      if (err) {
        return response.serverError({error: 'Error retrieving user.'});
      }

      if (!user) {
        return response.badRequest({error: 'Username not found.'});
      }

      request.login(user, function (loginErr) {

        if (loginErr) {
          return response.badRequest(loginErr);
        }

        // Upon successful login, send the user to the homepage were req.user
        // will available.
        return response.ok(user);
      });
    });
  },

  signup: function(request, response) {
    passport.signup(request, response, function(err, user) {
      if (err) {
        return response.serverError({error: 'Server error: Error creating user.', details: err.details});
      }

      if (!user) {
        return response.badRequest({error: 'Request error: user was not created.'});
      }

      return response.ok(user);
    });
  }
};

module.exports = AuthController;
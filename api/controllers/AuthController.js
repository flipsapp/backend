/**
 * Authentication Controller
 *
 * This is merely meant as an example of how your Authentication controller
 * should look. It currently includes the minimum amount of functionality for
 * the basics of Passport.js to work.
 */

var AuthController = {

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
      if (err || !user) {
        return response.badRequest({error: 'Request error: Creating user.', details: err.details});
      }

      return response.ok(user);
    });
  },

  facebook: function(request, response) {
    passport.facebook(request, response, function(err, user) {
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

        // Upon successful login, send the user to the homepage
        // were req.user will available.
        return response.ok(user);
      });
    });
  }
};

module.exports = AuthController;
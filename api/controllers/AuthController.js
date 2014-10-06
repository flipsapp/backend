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
      return response.send(400, new MugError('Username and password are required'));
    }

    passport.signin(request, response, function(err, user) {

      if (err) {
        var errmsg = new MugError('Error signing in user', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }

      if (!user) {
        return response.send(404, new MugError('Username or password not found'));
      }

      request.login(user, function (loginErr) {

        if (loginErr) {
          return response.send(400, new MugError('Error logging in user', loginErr));
        }

        // Upon successful login, send the user to the homepage were req.user
        // will available.
        return response.send(200, user);
      });
    });
  },

  signup: function(request, response) {
    passport.signup(request, response, function(err, user) {
      if (err || !user) {
        return response.send(400, new MugError('Error signing up user', err));
      }
      request.login(user, function (loginErr) {

        if (loginErr) {
          return response.send(400, new MugError('Error logging in user', loginErr));
        }

        // Upon successful login, send the user to the homepage
        // were req.user will available.
        return response.send(200, user);
      });
    });
  },

  facebook: function(request, response) {
    passport.facebook(request, response, function(err, user) {
      if (err) {
        var errmsg = new MugError('Error retrieving user', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }

      if (!user) {
        return response.send(404, new MugError('Username not found'));
      }

      request.login(user, function (loginErr) {

        if (loginErr) {
          return response.send(400, new MugError('Error logging in user', loginErr));
        }

        // Upon successful login, send the user to the homepage
        // were req.user will available.
        return response.send(200, user);
      });
    });
  }
};

module.exports = AuthController;
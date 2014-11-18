/**
 * Authentication Controller
 *
 * This is merely meant as an example of how your Authentication controller
 * should look. It currently includes the minimum amount of functionality for
 * the basics of Passport.js to work.
 */
var Krypto = requires('>/api/utilities/Krypto');

var AuthController = {

  signin: function(request, response) {
    var username = request.body.username;
    var password = request.body.password;

    if (!username || !password) {
      return response.send(400, new FlipsError('Username and password are required'));
    }

    passport.signin(request, response, function(err, user) {

      if (err) {
        var errmsg = new FlipsError('Error signing in user', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }

      if (!user) {
        return response.send(404, new FlipsError('Username or password not found'));
      }

      request.login(user, function (loginErr) {

        if (loginErr) {
          return response.send(400, new FlipsError('Error logging in user', loginErr));
        }

        // Upon successful login, send the user to the homepage were req.user
        // will available.
        return response.send(200, Krypto.decryptUser(user));
      });
    });
  },

  signup: function(request, response) {
    passport.signup(request, response, function(err, user) {
      if (err || !user) {
        return response.send(400, new FlipsError('Error signing up user', err));
      }
      logger.debug('user signed-up');

      request.login(Krypto.encryptUser(user), function (loginErr) {

        if (loginErr) {
          logger.error('Error logging user after creation: ' + loginErr);
          return response.send(400, new FlipsError('Error logging in user', loginErr));
        }

        logger.debug('user signed-in');

        // Upon successful login, send the user to the homepage
        // were req.user will available.
        return response.send(200, Krypto.decryptUser(user));
      });
    });
  },

  facebook: function(request, response) {
    passport.facebook(request, response, function(err, user) {
      if (err) {
        var errmsg = new FlipsError('Error retrieving user', err);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }

      if (!user) {
        return response.send(404, new FlipsError('Username not found'));
      }

      request.login(Krypto.encryptUser(user), function (loginErr) {

        if (loginErr) {
          return response.send(400, new FlipsError('Error logging in user', loginErr));
        }

        // Upon successful login, send the user to the homepage
        // were req.user will available.
        return response.send(200, Krypto.decryptUser(user));
      });
    });
  }
};

module.exports = AuthController;
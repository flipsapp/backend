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
        return response.send(404, new FlipsError('Email or Password incorrect, or account does not exist.'));
      }

      if (user.isTemporary) {
        return response.send(404, new FlipsError('User was not validated. Please sign up or validate verification code.'))
      }

      if (user.isBlocked) {
        return response.send(421, new FlipsError('Account Disabled', 'Please contact Flips Support via www.flipsapp.com.'))
      }

      request.login(user, function (loginErr) {

        if (loginErr) {
          return response.send(400, new FlipsError('Error logging in user', loginErr));
        }

        logger.debug('inside signin -> request.login');
        logger.debug(user);

        // Upon successful login, send the user to the homepage were req.user
        // will available.
        return response.send(200, Krypto.decryptUser(user));
      });
    });
  },

  signup: function(request, response) {
    logger.debug('ENTERED USER SIGNUP');
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
        logger.debug(user);
        // Upon successful login, send the user to the homepage
        // were req.user will available.
        return response.send(200, Krypto.decryptUser(user));
      });
    });
  },

  facebook: function(request, response) {
    passport.facebook(request, response, function(err, user) {
      if (err) {
        var errmsg = new FlipsError('Error retrieving user', err.message);
        logger.error(errmsg);
        return response.send(500, errmsg);
      }

      if (!user || user.isTemporary) {
        //Expected behavior when logging with FB for the first time or didn't validate verification code.
        return response.send(404, new FlipsError('User not found'));
      }

      request.login(Krypto.encryptUser(user), function (loginErr) {

        if (loginErr) {
          return response.send(400, new FlipsError('Error logging in user', loginErr));
        }

        // Upon successful login, send the user to the homepage
        // where req.user will available.
        return response.send(200, Krypto.decryptUser(user));
      });
    });
  },

  checkSession: function(request, response) {
    return response.send(200, {});
  }

};

module.exports = AuthController;
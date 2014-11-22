var path     = require('path')
  , url      = require('url')
  , passport = require('passport')
  , moment = require('moment')
  , Krypto = requires('>/api/utilities/Krypto')
  , FB       = require('fb');

// Load authentication protocols
passport.protocols = require('./protocols');

passport.callback = function (req, res, next) {
  logger.debug('INTO passport callback');
  var provider = req.param('provider', 'local')
    , action   = req.param('action');

  if (provider === 'local') {
    if (!req.user) {
      logger.debug('INTO passport callback register');
      this.protocols.local.register(req, res, next);
    } else {
      this.protocols.local.connect(req, res, next);
    }
  }
};

passport.facebook = function(request, response, next) {
  var access_token = request.headers['facebook_access_token'] || request.headers['token'];
  var facebookConfig = sails.config.passport.facebook.options;

  logger.info('Trying to authenticate with Facebook using token ['+access_token+']');
  logger.info('Headers ['+JSON.stringify(request.headers)+']');

  if (!access_token) {
    return response.send(400, new FlipsError('access_token header not defined.'));
  }

  FB.api('/me', {
    fields: ['id', 'first_name', 'last_name', 'birthday', 'age_range', 'email', 'picture.width(160)'],
    access_token: access_token,
    client_id: facebookConfig.clientID,
    client_secret: facebookConfig.clientSecret
  }, function (fbProfile) {

    if (!fbProfile) {
      return next(new FlipsError('Unable to retrieve Facebook Account.'));
    }

    if (fbProfile.error) {
      return next(fbProfile.error);
    }

    var userEmail = Krypto.encrypt(fbProfile.email);

    User.findOne({ username: userEmail })
      .populate('devices')
      .exec(function(err, user) {
        if (err) {
          return next(new FlipsError('Error retrieving User.'));
        }

        if (!user) {
          createFacebookUser(fbProfile, next);
        } else {

          user.facebookID = Krypto.encrypt(fbProfile.id);
          user.firstName = Krypto.encrypt(fbProfile.first_name);
          user.lastName = Krypto.encrypt(fbProfile.last_name);
          user.photoUrl = fbProfile.picture.data.url;

          user.save();

          next(null, Krypto.decryptUser(user))
        }
      }
    );
  });
},

passport.signin = function(request, response, next) {
  this.protocols.local.login(request, request.body.username, request.body.password, next);
};

passport.signup = function(request, response, next) {
  logger.debug('INTO passport signup');
  this.protocols.local.register(request, response, next);
};

/**
 * Load all strategies defined in the Passport configuration
 *
 * For example, we could add this to our config to use the GitHub strategy
 * with permission to access a users email address (even if it's marked as
 * private) as well as permission to add and update a user's Gists:
 *
 * For more information on the providers supported by Passport.js, check out:
 * http://passportjs.org/guide/providers/
 *
 */
passport.loadStrategies = function () {
  var self       = this
    , strategies = sails.config.passport;

  Object.keys(strategies).forEach(function (key) {
    var options = { passReqToCallback: true }, Strategy;

    if (key === 'local') {
      // Since we need to allow users to login using both usernames as well as
      // emails, we'll set the username field to something more generic.
      _.extend(options, { usernameField: 'identifier' });

      // Only load the local strategy if it's enabled in the config
      if (strategies.local) {
        Strategy = strategies[key].strategy;

        self.use(new Strategy(options, self.protocols.local.login));
      }
    }
  });
};

passport.serializeUser(function (user, next) {
  next(null, user.id);
});

passport.deserializeUser(function (id, next) {
  User.findOne(id).exec(function(err, user) {
    next(err, user);
  })
});

module.exports = passport;


var createFacebookUser = function(fbProfile, next) {
  var userModel = {
    username  : fbProfile.email,
    password  : fbProfile.password || '',
    facebookID: Krypto.encrypt(fbProfile.id),
    firstName : fbProfile.first_name,
    lastName  : fbProfile.last_name,
    birthday : fbProfile.birthday || moment().subtract(fbProfile.age_range.min, 'years'),
    photoUrl  : fbProfile.picture.data.url
  };

  passport.protocols.local.createUser(userModel, function(err, user) {
    if (err) {
      return next(err);
    }

    if (!user) {
      return next(new FlipsError('Error creating user.'));
    }

    return next(null, user);
  });
};
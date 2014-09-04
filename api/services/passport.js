var path     = require('path')
  , url      = require('url')
  , passport = require('passport')
  , FB       = require('fb');

// Load authentication protocols
passport.protocols = require('./protocols');

passport.callback = function (req, res, next) {
  var provider = req.param('provider', 'local')
    , action   = req.param('action');

  if (provider === 'local') {
    if (!req.user) {
      this.protocols.local.register(req, res, next);
    } else {
      this.protocols.local.connect(req, res, next);
    }
  }
};

passport.facebook = function(request, response, next) {
  var accessToken = request.headers['access_token'];
  var facebookConfig = sails.config.passport.facebook.options;

  if (!accessToken) {
    return response.badRequest({ error: 'access_token header not defined.'});
  }

  FB.api('/me', {
    fields: ['id', 'first_name', 'last_name', 'birthday', 'email', 'picture.width(160)'],
    access_token: accessToken,
    client_id: facebookConfig.clientID,
    client_secret: facebookConfig.clientSecret
  }, function (fbProfile) {

    if (!fbProfile) {
      return next({ error: 'Unable to retrieve Facebook Account.'});
    }

    if (fbProfile.error) {
      return next(fbProfile.error);
    }

    User.findOne({ username: fbProfile.email})
      .exec(function(err, user) {
        if (err) {
          return next({ error: 'Error retrieving User.'});
        }

        if (!user) {
          createFacebookUser(fbProfile, next);
        } else {
          var updateColumns = {
            facebookID: fbProfile.id,
            firstName : fbProfile.first_name,
            lastName  : fbProfile.last_name,
            birthdate : fbProfile.birthday,
            photoUrl  : fbProfile.picture.data.url
          };

          var whereClause = {
            id: user.id
          };

          User.update(whereClause, updateColumns)
            .exec(function(err, affectedUsers) {
              if (err) {
                return next({ error: 'Error updating User.'});
              }

              if (!affectedUsers || affectedUsers.length < 1) {
                return next({ error: 'Error updating User.'});
              }

              return next(null, affectedUsers[0]);
            });
        }
      }
    );
  });
},

passport.signin = function(request, response, next) {
  this.protocols.local.login(request, request.body.username, request.body.password, next);
};

passport.signup = function(request, response, next) {
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
  User.findOne(id, next);
});

module.exports = passport;


var createFacebookUser = function(fbProfile, next) {
  var userModel = {
    username  : fbProfile.email,
    password  : fbProfile.password || '',
    facebookID: fbProfile.id,
    firstName : fbProfile.first_name,
    lastName  : fbProfile.last_name,
    birthdate : fbProfile.birthday,
    photoUrl  : fbProfile.picture.data.url
  };

  passport.protocols.local.createUser(userModel, function(err, user) {
    if (err) {
      return next(err);
    }

    if (!user) {
      return next({ error: 'Error creating user.'} );
    }

    return next(null, user);
  });
};
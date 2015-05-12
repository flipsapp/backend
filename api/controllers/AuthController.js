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
  },

  twilioStatus: function(request, response) {
    checkServiceStatus(response, checkTwilioStatus);
  },

  s3Status: function(request, response) {
    checkServiceStatus(response, checkS3Status);
  },

  pubnubStatus: function(request, response) {
    checkServiceStatus(response, checkPubnubStatus);
  },

  databaseStatus: function(request, response) {
    checkServiceStatus(response, checkDatabaseStatus);
  }

};

function checkServiceStatus(response, service) {
  var response_code = 200;
  service(function(status) {
    if (status.code == 1) {
      response_code = 500;
    }
    return response.send(response_code, status);
  });
}

function checkPubnubStatus(cb) {
  var pubnub = require("pubnub").init({
    ssl: true,
    publish_key: process.env.PUBNUB_PUB_KEY,
    subscribe_key: process.env.PUBNUB_SUB_KEY
  });

  var status = {};
  status.service = 'Pubnub';
  var startTime = getTimeInMilliseconds();
  pubnub.time(function (time) {
    var elapsedTime = getTimeInMilliseconds() - startTime;
    if (!time) {
      status.code = 1;
      status.description = 'PubNub service is not available';
    } else {
      status.code = 0;
      status.description = 'PubNub service is up and running';
    }
    status.elapsed_time = elapsedTime;
    cb(status);
  });
}

function checkTwilioStatus(cb) {
  var twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  var status = {};
  status.service = 'Twilio';
  var startTime = getTimeInMilliseconds();
  twilio.accounts(process.env.TWILIO_ACCOUNT_SID).get(function (err, account) {
    var elapsedTime = getTimeInMilliseconds() - startTime;
    if (err) {
      status.code = 1;
      status.description = 'Twilio service is not available: ' + err;
    } else {
      status.code = 0;
      status.description = 'Twilio service is up and running';
    }
    status.elapsed_time = elapsedTime;
    cb(status);
  });
}

function checkS3Status(cb) {
  var AWS = require('aws-sdk');
  var s3 = new AWS.S3({
    accessKeyId: process.env.AWS_S3_KEY,
    secretAccessKey: process.env.AWS_S3_SECRET
  });
  var status = {};
  status.service = 'Amazon S3';
  var startTime = getTimeInMilliseconds();
  s3.listBuckets(function(err, data) {
    var elapsedTime = getTimeInMilliseconds() - startTime;
    if (err) {
      status.code = 1;
      status.description = 'Amazon S3 service is not available: ' + err;
      response_code = 500;
    }
    else {
      status.code = 0;
      status.description = 'Amazon S3 service is up and running';
    }
    status.elapsed_time = elapsedTime;
    cb(status);
  });
}

function checkDatabaseStatus(cb) {
  var status = {};
  status.service = 'MySQL Database';
  var startTime = getTimeInMilliseconds();
  User.findOne({username: process.env.TEAMFLIPS_USERNAME}).exec(function (err, user) {
    var elapsedTime = getTimeInMilliseconds() - startTime;
    if (err) {
      status.code = 1;
      status.description = 'MySQL Database connection is down or database error: ' + err;
      response_code = 500;
    } else {
      status.code = 0;
      status.description = 'MySQL Database connection is up and running';
    }
    status.elapsed_time = elapsedTime;
    cb(status);
  });
}

function getTimeInMilliseconds() {
  var d = new Date();
  return d.getTime();
}

module.exports = AuthController;
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

  status: function(request, response) {
    checkPubnubStatus(response);
  }

};

function checkPubnubStatus(response) {
  var pubnub = require("pubnub").init({
    ssl: true,
    publish_key: process.env.PUBNUB_PUB_KEY,
    subscribe_key: process.env.PUBNUB_SUB_KEY
  });

  var status = {};
  var pubnub_status = {};
  var response_code = 200;
  var startTime = getTimeInMilliseconds();
  pubnub.time(function (time) {
    var elapsedTime = getTimeInMilliseconds() - startTime;
    if (!time) {
      pubnub_status.status_code = 1;
      pubnub_status.status_description = 'PubNub service is not available';
      response_code = 500;
    } else {
      pubnub_status.status_code = 0;
      pubnub_status.status_description = 'PubNub service is up and running';
    }
    pubnub_status.elapsed_time = elapsedTime;
    status.pubnub_status = pubnub_status;
    checkTwilioStatus(response, response_code, status);
  });
}

function checkTwilioStatus(response, response_code, status) {
  var twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  var twilio_status = {};
  var startTime = getTimeInMilliseconds();
  twilio.accounts(process.env.TWILIO_ACCOUNT_SID).get(function (err, account) {
    var elapsedTime = getTimeInMilliseconds() - startTime;
    if (err) {
      twilio_status.status_code = 1;
      twilio_status.status_description = 'Twilio service is not available: ' + err;
      response_code = 500;
    } else {
      twilio_status.status_code = 0;
      twilio_status.status_description = 'Twilio service is up and running';
    }
    twilio_status.elapsed_time = elapsedTime;
    status.twilio_status = twilio_status;
    // bypassing S3 status check
    //checkAmazonStatus(response, response_code, status);
    checkDatabaseStatus(response, response_code, status);
  });
}

function checkAmazonStatus(response, response_code, status) {
  var AWS = require('aws-sdk');
  var s3 = new AWS.S3({
    accessKeyId: process.env.AWS_S3_KEY,
    secretAccessKey: process.env.AWS_S3_SECRET
  });
  var s3_status = {};
  var startTime = getTimeInMilliseconds();
  s3.listBuckets(function(err, data) {
    var elapsedTime = getTimeInMilliseconds() - startTime;
    if (err) {
      s3_status.status_code = 1;
      s3_status.status_description = 'Amazon S3 service is not available: ' + err;
      response_code = 500;
    }
    else {
      s3_status.status_code = 0;
      s3_status.status_description = 'Amazon S3 service is up and running';
    }
    s3_status.elapsed_time = elapsedTime;
    status.s3_status = s3_status;
    checkDatabaseStatus(response, response_code, status);
  });
}

function checkDatabaseStatus(response, response_code, status) {
  var database_status = {};
  var startTime = getTimeInMilliseconds();
  User.findOne({username: process.env.TEAMFLIPS_USERNAME}).exec(function (err, user) {
    var elapsedTime = getTimeInMilliseconds() - startTime;
    if (err) {
      database_status.status_code = 1;
      database_status.status_description = 'Database connection is down or database error: ' + err;
      response_code = 500;
    } else {
      database_status.status_code = 0;
      database_status.status_description = 'Database connection is up and running';
    }
    database_status.elapsed_time = elapsedTime;
    status.database_status = database_status;
    return response.send(response_code, status);
  });
}

function getTimeInMilliseconds() {
  var d = new Date();
  return d.getTime();
}

module.exports = AuthController;
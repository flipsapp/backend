GLOBAL.requires = require('r').r;
GLOBAL.MugError = requires('>/api/utilities/MugError');

// CREATE AND LOAD ENVIRONMENT VARIABLES

var dotenv_path = './.dev-env';
var sinon = require('sinon');
var app = null;
var sails = require('sails');

var dotenv = require('dotenv');
dotenv._getKeysAndValuesFromEnvFilePath(dotenv_path);
dotenv._setEnvs();

// Instantiate the Sails app instance we'll be using
// (note that we don't use `new`, just call it like a function)
var start = function () {
  before(function (done) {
    console.log('########## BOOTSTRAP BEFORE #############');
    // Lift Sails and store the app reference
    this.timeout(10000);

    sails.lift({

      // Basic options you should pretty much always use for tests:
      /////////////////////////////////////////////////////////////////////////////

      // turn down the log level so we can view the test results
      log: {
        level: 'info'
      },

      connections: {
        memory: {
          adapter: 'sails-memory'
        }
      },

      session: {
        adapter: 'memory'
      },

      models: {
        connection: 'memory'
      },

      session: {
        adapter: 'memory'
      }

    }, function (err, sails) {
      app = sails;

      sinon.stub(app.services.twilioservice, 'sendSms', function(to, message, callback) {
        callback(null, { status: "Sent" });
      });

      sinon.stub(app.services.s3service, 'upload', function(file, bucket, callback) {
        if (bucket === 'mugchat-sound') {
          callback(null, [{ extra: {Location: "https://mugchat-sound.s3.amazonaws.com/43346217-6b53-484d-980c-6cca226f16f0.wav"} }]);
        } else if (bucket === 'mugchat-background') {
          callback(null, [{ extra: {Location: "https://mugchat-background.s3.amazonaws.com/43346217-6b53-484d-980c-6cca226f16f0.jpg"} }]);
        } else {
          callback(null, [{ extra: {Location: "https://mugchat-pictures.s3.amazonaws.com/43346217-6b53-484d-980c-6cca226f16f0.jpg"} }]);
        }
      });

      sinon.stub(app.services.pubnubgateway, 'addDeviceToPushNotification', function(token, channel, type, callback) {
        callback(null, channel);
      });

      done(err, sails);
    });

  });

// After Function
  after(function (done) {
    console.log('########## BOOTSTRAP AFTER #############');
    app.lower(done);
  });
};

module.exports = start;
GLOBAL.requires = require('r').r;
GLOBAL.MugError = requires('>/api/utilities/MugError');

// Require app factory
var sails = require('sails');

// Instantiate the Sails app instance we'll be using
// (note that we don't use `new`, just call it like a function)

var app = null;

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

      models: {
        connection: 'memory'
      }

    }, function (err, sails) {
      app = sails;
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
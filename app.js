/**
 * app.js
 *
 * Use `app.js` to run your app without `sails lift`.
 * To start the server, run: `node app.js`.
 *
 * This is handy in situations where the sails CLI is not relevant or useful.
 *
 * For example:
 *   => `node app.js`
 *   => `forever start app.js`
 *   => `node debug app.js`
 *   => `modulus deploy`
 *   => `heroku scale`
 *
 *
 * The same command-line arguments are supported, e.g.:
 * `node app.js --silent --port=80 --prod`
 */

// Ensure we're in the project directory, so relative paths work as expected
// no matter where we actually lift from.
process.chdir(__dirname);

GLOBAL.requires = require('r').r;
GLOBAL.FlipsError = requires('>/api/utilities/FlipsError');

//catch unhandled exceptions
process.on('uncaughtException', function (exception) {
  console.log("We found an uncaught exception");
  console.log("******************************")
  console.log(exception.stack);
  logger.error("We found an uncaught exception");
  logger.error("******************************");
  logger.error(exception.stack);
});

// CREATE AND LOAD ENVIRONMENT VARIABLES
var dotenv_path;
if (process.env.NODE_ENV && process.env.NODE_ENV.toUpperCase() === 'PRODUCTION') {
  dotenv_path = './.prod-env';
} else if (process.env.NODE_ENV && process.env.NODE_ENV.toUpperCase() === 'DEVELOPMENT') {
  dotenv_path = './.dev-env';
} else {
  dotenv_path = './.qa-env';
}

var dotenv = require('dotenv');
dotenv._getKeysAndValuesFromEnvFilePath(dotenv_path);
dotenv._setEnvs();

/////////////////////////////

Object.defineProperty(Error.prototype, 'toJSON', {
  value: function () {
    var alt = {};

    Object.getOwnPropertyNames(this).forEach(function (key) {
      alt[key] = this[key];
    }, this);

    return alt;
  },
  configurable: true
});

// Ensure a "sails" can be located:
(function () {
  var sails;
  try {
    sails = require('sails');
  } catch (e) {
    console.error('To run an app using `node app.js`, you usually need to have a version of `sails` installed in the same directory as your app.');
    console.error('To do that, run `npm install sails`');
    console.error('');
    console.error('Alternatively, if you have sails installed globally (i.e. you did `npm install -g sails`), you can use `sails lift`.');
    console.error('When you run `sails lift`, your app will still use a local `./node_modules/sails` dependency if it exists,');
    console.error('but if it doesn\'t, the app will run with the global sails instead!');
    return;
  }

  // Try to get `rc` dependency
  var rc;
  try {
    rc = require('rc');
  } catch (e0) {
    try {
      rc = require('sails/node_modules/rc');
    } catch (e1) {
      console.error('Could not find dependency: `rc`.');
      console.error('Your `.sailsrc` file(s) will be ignored.');
      console.error('To resolve this, run:');
      console.error('npm install rc --save');
      rc = function () {
        return {};
      };
    }
  }


  // Start server
  sails.lift(rc('sails'));

})();

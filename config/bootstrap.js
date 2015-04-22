/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.bootstrap.html
 */

var Krypto = requires('>/api/utilities/Krypto');

module.exports.bootstrap = function(cb) {

  sails.services.passport.loadStrategies();

  // It's very important to trigger this callback method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)

  User.create({
    username: process.env.TEAMFLIPS_USERNAME,
    firstName: process.env.TEAMFLIPS_FIRST_NAME,
    lastName: process.env.TEAMFLIPS_LAST_NAME,
    photoUrl: process.env.TEAMFLIPS_PHOTO_URL,
    birthday: process.env.TEAMFLIPS_BIRTHDAY,
    phoneNumber: process.env.TEAMFLIPS_PHONE_NUMBER,
    isTemporary: false
  }).exec(function(err, teamFlipsUser) {
    if (teamFlipsUser) {
      Passport.create({
        protocol: 'local', password: process.env.TEAMFLIPS_PASSWORD, user: teamFlipsUser.id
      }, function (passportError, passport) {
        if (passportError) {
          logger.error("##### CRITICAL ERROR: Error creating passport for Team Flips user");
        } else {
          createStockFlipsUser(cb);
        }
      });
    } else {
      createStockFlipsUser(cb);
    }
  });

  function createStockFlipsUser(cb) {
    User.create({
      username: process.env.STOCKFLIPS_USERNAME,
      firstName: process.env.STOCKFLIPS_FIRST_NAME,
      lastName: process.env.STOCKFLIPS_LAST_NAME,
      photoUrl: process.env.STOCKFLIPS_PHOTO_URL,
      birthday: process.env.STOCKFLIPS_BIRTHDAY,
      phoneNumber: process.env.STOCKFLIPS_PHONE_NUMBER,
      isTemporary: false
    }).exec(function(err, stockFlipsUser) {
      if (stockFlipsUser) {
        Passport.create({
          protocol: 'local', password: process.env.STOCKFLIPS_PASSWORD, user: stockFlipsUser.id
        }, function (passportError, passport) {
          if (passportError) {
            logger.error("##### CRITICAL ERROR: Error creating passport for Stock Flips user");
          } else {
            updateTeamFlipsPassword(cb);
          }
        });
      } else {
        updateTeamFlipsPassword(cb);
      }
    });
  }

  function updateTeamFlipsPassword(cb) {

    var PASSWORD_REGEX = '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$';
    var newPassword = process.env.TEAMFLIPS_PASSWORD;

    if (!newPassword.match(PASSWORD_REGEX)) {
      logger.error('##### CRITICAL ERROR: Team Flips Password must have at least eight characters, one uppercase letter and one lowercase letter and one number.');
    } else {
      User.findOne({username: Krypto.encrypt(process.env.TEAMFLIPS_USERNAME)}).exec(function(err, user) {
        Passport.update({user: user.id}, {password: newPassword}, function (error, userRecords) {
          if (error) {
            logger.error('##### CRITICAL ERROR: Error while trying to update password for Team Flips user');
          } else {
            if (!userRecords || userRecords.length < 1) {
              logger.error('##### CRITICAL ERROR: No rows affected when trying to update password for Team Flips user');
            } else {
              updateStockFlipsPassword(cb);
            }
          }
        });
      });
    }

  }

  function updateStockFlipsPassword(cb) {

    var PASSWORD_REGEX = '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$';
    var newPassword = process.env.STOCKFLIPS_PASSWORD;

    if (!newPassword.match(PASSWORD_REGEX)) {
      logger.error('##### CRITICAL ERROR: Stock Flips Password must have at least eight characters, one uppercase letter and one lowercase letter and one number.');
    } else {
      User.findOne({username: Krypto.encrypt(process.env.STOCKFLIPS_USERNAME)}).exec(function(err, user) {
        Passport.update({user: user.id}, {password: newPassword}, function (error, userRecords) {
          if (error) {
            logger.error('##### CRITICAL ERROR: Error while trying to update password for Stock Flips user');
          } else {
            if (!userRecords || userRecords.length < 1) {
              logger.error('##### CRITICAL ERROR: No rows affected when trying to update password for Team Flips user');
            } else {
              cb();
            }
          }
        });
      });
    }

  }

};

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

module.exports.bootstrap = function(cb) {

  sails.services.passport.loadStrategies();

  // It's very important to trigger this callback method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)

  User.create({
    username: process.env.FLIPBOYS_USERNAME,
    firstName: 'FlipBoys',
    lastName: ' ',
    photoUrl: 'https://s3.amazonaws.com/flips-pictures/flipboys_avatar.png',
    birthday: '1970-01-01',
    phoneNumber: '+14155555555',
    isTemporary: false
  }).exec(function(err, flipboysUser) {
    if (flipboysUser) {
      Passport.create({
        protocol: 'local', password: process.env.FLIPBOYS_PASSWORD, user: flipboysUser.id
      }, function (passportError, passport) {
        User.create({
          username: process.env.STOCKFLIPS_USERNAME,
          firstName: 'Stock',
          lastName: 'Flips',
          photoUrl: 'https://s3.amazonaws.com/flips-pictures/flipboys_avatar.png',
          birthday: '1970-01-01',
          phoneNumber: '+14155555556',
          isTemporary: false
        }).exec(function(err, stockflipsUser) {
          if (stockflipsUser) {
            Passport.create({
              protocol: 'local', password: process.env.STOCKFLIPS_PASSWORD, user: stockflipsUser.id
            }, function (passportError, passport) {
              cb();
            });
          } else {
            cb();
          }
        });
      });
    } else {
      User.create({
        username: process.env.STOCKFLIPS_USERNAME,
        firstName: 'Stock',
        lastName: 'Flips',
        photoUrl: 'https://s3.amazonaws.com/flips-pictures/flipboys_avatar.png',
        birthday: '1970-01-01',
        phoneNumber: '+14155555556'
      }).exec(function(err, stockflipsUser) {
        if (stockflipsUser) {
          Passport.create({
            protocol: 'local', password: process.env.STOCKFLIPS_PASSWORD, user: stockflipsUser.id
          }, function (passportError, passport) {
            cb();
          });
        } else {
          cb();
        }
      });
    }

  });
};

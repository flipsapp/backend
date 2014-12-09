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
    username: 'flipboys@flips.com',
    firstName: 'FlipBoys',
    lastName: ' ',
    photoUrl: 'https://s3.amazonaws.com/flips-pictures/flipboys_avatar.png',
    birthday: '1970-01-01',
    phoneNumber: '+14155555555'
  }).exec(function(err, user) {
    cb();
  });
};

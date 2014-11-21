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

  console.log(Krypto.decrypt('ba1d161e5bc890b323e4'));
  console.log(Krypto.decrypt('e11d'));
  console.log(Krypto.decrypt('e01a'));
  console.log(Krypto.decrypt('be4a111f5fc891bc26e20132da35285a827222456bfcc805'));


  sails.services.passport.loadStrategies();

  // It's very important to trigger this callback method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)

  User.create({
    username: 'flipboys@flips.com',
    firstName: 'Flip',
    lastName: 'Boys',
    birthday: '1970-01-01',
    phoneNumber: '+14155555555'
  }).exec(function(err, user) {
    cb();
  });
};

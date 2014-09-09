/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {

  '/': {
    view: 'homepage'
  },

  'POST   /signin'                                : 'AuthController.signin',
  'POST   /signup'                                : 'AuthController.signup',
  'POST   /signin/facebook'                       : 'AuthController.facebook',

  'GET    /mugs/stock'                            : 'MugController.stockMugs', // all stock mugs or filtered by category or owner or both
                                                                               // /mugs/stock?category=Toon
                                                                               // /mugs/stock?owner=123
                                                                               // /mugs/stock?category=Toon&owner=123
  'POST   /user/forgot'                           : 'UserController.forgot',
  'POST   /user/verify'                           : 'UserController.verify',
  'POST   /user/:user_id/mugs'                    : 'MugController.create',
  'PUT    /user/:user_id/mugs/:mug_id/background' : 'MugController.updateBackground',
  'PUT    /user/:user_id/mugs/:mug_id/sound'      : 'MugController.updateSound',
  'GET    /user/:user_id/mugs/:mug_id'            : 'MugController.mugById',
  'GET    /user/:user_id/mugs'                    : 'MugController.myMugs',  // all mugs or filtered by word -> /user/:user_id/mugs?word='San Francisco'

  'PUT    /user/:parentid/photo'                  : 'UserController.uploadPhoto',
  'POST   /user/:parentid/devices'                : 'DeviceController.create',
  'GET    /user/:parentid/devices/:id'            : 'DeviceController.findOne',
  'POST   /user/:parentid/devices/:id/verify'     : 'DeviceController.verify',

  'POST   /background'                            : 'MugController.uploadBackground',
  'POST   /sound'                                 : 'MugController.uploadSound'

};

/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on how policies work, see:
 * http://sailsjs.org/#/documentation/concepts/Policies
 *
 * For more information on configuring policies, check out:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.policies.html
 */


module.exports.policies = {

  /***************************************************************************
  *                                                                          *
  * Default policy for all controllers and actions (`true` allows public     *
  * access)                                                                  *
  *                                                                          *
  ***************************************************************************/

  '*': ['passport'],

  UserController: {
    forgot: true,
    verify: true,
    uploadPhoto: ['passport', 'owner'],
    update: ['passport', 'owner']
  },

	MugController: {
    create: ['passport', 'owner'],
    uploadBackground: ['passport'],
    uploadSound: ['passport'],
    updateBackground: ['passport', 'owner'],
    updateSound: ['passport', 'owner'],
    myMugs: ['passport', 'owner'],
    mugById: ['passport', 'owner']
  },

  DeviceController: {
    findOne: ['passport', 'deviceOwner']
  }

};

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

  '*': ['passport', 'version'],

  UserController: {
    forgot: 'version',
    verify: 'version',
    updatePassword: 'version',
    uploadPhoto: ['passport', 'owner', 'version'],
    update: ['passport', 'owner', 'version'],
    findOne: ['passport', 'owner', 'version'],
    populate: ['passport', 'owner', 'version'],
    inviteContacts: ['passport', 'version'],
    myRooms: ['passport', 'owner', 'version'],
    verifyContacts: ['passport', 'version'],
    verifyFacebookUsers: ['passport', 'version'],
    findById: ['passport', 'owner', 'version'],
    printUsers: true,
    findActiveUserByPhoneNumber: ['passport', 'version'],
    resendCodeWhenChangingNumber: ['passport', 'owner', 'deviceOwner', 'version']
  },

	FlipController: {
    create: ['passport', 'flipOwner', 'version'],
    uploadBackground: ['passport', 'version'],
    uploadSound: ['passport', 'version'],
    uploadThumbnail: ['passport', 'version'],
    updateBackground: ['passport', 'flipOwner', 'version'],
    updateSound: ['passport', 'flipOwner', 'version'],
    updateThumbnail: ['passport', 'flipOwner', 'version'],
    myFlips: ['passport', 'flipOwner', 'version'],
    flipById: ['passport', 'flipOwner', 'version'],
    stockFlips: ['passport', 'version']
  },

  DeviceController: {
    findOne: ['passport', 'owner', 'deviceOwner', 'version'],
    create : ['passport', 'owner', 'version'],
    verify : ['passport', 'version'],
    resendVerificationCode: ['passport', 'owner', 'deviceOwner', 'version'],
    registerForPushNotifications: ['passport', 'owner', 'deviceOwner', 'version'],
    unregisterForPushNotifications: ['passport', 'owner', 'deviceOwner', 'version']
  },

  ContactController: {
    uploadContacts: ['passport', 'owner', 'version']
  },

  RoomController: {
    create: ['passport', 'owner', 'version'],
    updateParticipants: ['passport', 'owner', 'version'],
    update: ['passport', 'owner', 'version'],
    destroy: ['passport', 'owner', 'version']
  },

  AuthController: {
    checkSession: ['passport', 'owner', 'version'],
    minimumAppVersion: 'version'
  }
};

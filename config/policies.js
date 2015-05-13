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
    uploadPhoto: ['passport', 'owner', 'version', 'checkBlockedUser'],
    update: ['passport', 'owner', 'version', 'checkBlockedUser'],
    findOne: ['passport', 'owner', 'version', 'checkBlockedUser'],
    populate: ['passport', 'owner', 'version', 'checkBlockedUser'],
    inviteContacts: ['passport', 'version', 'checkBlockedUser'],
    myRooms: ['passport', 'owner', 'version', 'checkBlockedUser'],
    verifyContacts: ['passport', 'version', 'checkBlockedUser'],
    verifyFacebookUsers: ['passport', 'version', 'checkBlockedUser'],
    findById: ['passport', 'owner', 'version', 'checkBlockedUser'],
    printUsers: true,
    findActiveUserByPhoneNumber: ['passport', 'version', 'checkBlockedUser'],
    resendCodeWhenChangingNumber: ['passport', 'owner', 'deviceOwner', 'version', 'checkBlockedUser']
  },

	FlipController: {
    create: ['passport', 'flipOwner', 'version', 'checkBlockedUser'],
    uploadBackground: ['passport', 'version', 'checkBlockedUser'],
    uploadSound: ['passport', 'version', 'checkBlockedUser'],
    uploadThumbnail: ['passport', 'version', 'checkBlockedUser'],
    updateBackground: ['passport', 'flipOwner', 'version', 'checkBlockedUser'],
    updateSound: ['passport', 'flipOwner', 'version', 'checkBlockedUser'],
    updateThumbnail: ['passport', 'flipOwner', 'version', 'checkBlockedUser'],
    myFlips: ['passport', 'flipOwner', 'version', 'checkBlockedUser'],
    flipById: ['passport', 'flipOwner', 'version', 'checkBlockedUser'],
    stockFlips: ['passport', 'version', 'checkBlockedUser']
  },

  DeviceController: {
    findOne: ['passport', 'owner', 'deviceOwner', 'version', 'checkBlockedUser'],
    create : ['passport', 'owner', 'version', 'checkBlockedUser'],
    verify : ['passport', 'version', 'checkBlockedUser'],
    resendVerificationCode: ['passport', 'owner', 'deviceOwner', 'version', 'checkBlockedUser'],
    registerForPushNotifications: ['passport', 'owner', 'deviceOwner', 'version', 'checkBlockedUser'],
    unregisterForPushNotifications: ['passport', 'owner', 'deviceOwner', 'version', 'checkBlockedUser']
  },

  RoomController: {
    create: ['passport', 'owner', 'version', 'checkBlockedUser'],
    updateParticipants: ['passport', 'owner', 'version', 'checkBlockedUser'],
    update: ['passport', 'owner', 'version', 'checkBlockedUser'],
    destroy: ['passport', 'owner', 'version', 'checkBlockedUser']
  },

  AuthController: {
    checkSession: ['passport', 'owner', 'version', 'checkBlockedUser'],
    twilioStatus: true,
    s3Status: true,
    pubnubStatus: true,
    databaseStatus: true,
    flipsStatus: true
  }

};

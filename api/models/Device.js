/**
* Device.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {

    user: {
      model: 'User'
    },

    phoneNumber: {
      type: 'string',
      required: true
    },

    platform: {
      type: 'string',
      required: true
    },

    uuid: {  // APNS token or GCM registration_id
      type: 'string'
    },

    verificationCode: {
      type: 'string'
    },

    isVerified: {
      type: 'boolean',
      defaultsTo: false
    },

    retryCount: {
      type: 'integer',
      defaultsTo: 0
    },

    toJSON: function () {
      var device = this.toObject();
      device.verificationCode = null;
      return device;
    }

  }
};
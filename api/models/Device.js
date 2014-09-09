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

    uuid: {
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
    }
  }
};
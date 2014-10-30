/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
var uuid = require('node-uuid');

var User = {

  attributes: {

    username: {
      type: 'string',
      unique: true,
      required: true
    },

    firstName: {
      type: 'string',
      required: true
    },

    lastName: {
      type: 'string',
      required: true
    },

    birthday: {
      type: 'datetime',
      required: true
    },

    facebookID: {
      type: 'string'
    },

    photoUrl: {
      type: 'url'
    },

    nickname: {
      type: 'string'
    },

    pubnubId: {
      type: 'string'
    },

    flips: {
      collection: 'Flip',
      via: 'owner'
    },

    devices: {
      collection: 'Device',
      via: 'user'
    },

    rooms: {
      collection: 'Room',
      via: 'participants'
    },

    contacts: {
      collection: 'Contact',
      via: 'owner'
    },

    phoneNumber: {
      type: 'string'
    }

  },

  beforeCreate: function (user, next) {
    user.pubnubId = uuid();
    next();
  }
};

module.exports = User;
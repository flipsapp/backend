/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
var uuid = require('node-uuid');
var Krypto = requires('>/api/utilities/Krypto');

var User = {

  connection: 'mysql_utf8bm4',

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

   phoneNumber: {
      type: 'string'
    },

    isTemporary: {
      type: 'boolean',
      defaultsTo: true
    },

    isBlocked: {
      type: 'boolean',
      defaultsTo: false
    }

  },

  beforeCreate: function (user, next) {
    user.pubnubId = uuid();
    if (user.username) {
      user.username = Krypto.encrypt(user.username);
    }
    if (user.firstName) {
      user.firstName = Krypto.encrypt(user.firstName);
    }
    if (user.lastName) {
      user.lastName = Krypto.encrypt(user.lastName);
    }
    if (user.phoneNumber) {
      user.phoneNumber = Krypto.encrypt(user.phoneNumber);
    }
    if (user.nickname) {
      user.nickname = Krypto.encrypt(user.nickname);
    }
    next();
  }

};

module.exports = User;
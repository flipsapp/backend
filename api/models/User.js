/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
var uuid = require('node-uuid');
var Krypto = requires('>/api/utilities/Krypto');

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

    phoneNumber: {
      type: 'string'
    },

    toJSON: function () {
      var user = this.toObject();
      user.username = Krypto.decrypt(user.username);
      user.firstName = Krypto.decrypt(user.firstName);
      user.lastName = Krypto.decrypt(user.lastName);
      user.phoneNumber = Krypto.decrypt(user.phoneNumber);
      return user;
    }

  },

  beforeCreate: function (user, next) {
    user.pubnubId = uuid();
    user.username = Krypto.encrypt(user.username);
    user.firstName = Krypto.encrypt(user.firstName);
    user.lastName = Krypto.encrypt(user.lastName);
    user.phoneNumber = Krypto.encrypt(user.phoneNumber);
    next(null, user);
  }

};

module.exports = User;
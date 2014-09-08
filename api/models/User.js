/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

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

    mugs: {
      collection: 'Mug',
      via: 'usedBy',
      dominant: true
    },

    devices: {
      collection: 'Device',
      via: 'user',
      dominant: true
    },

    rooms: {
      collection: 'Room',
      via: 'users'
    }/*,

    contacts: {
      collection: 'User',
      via: 'haveMeAsContact',
      dominant: 'true'
    },

    haveMeAsContact: {
      collection: 'User',
      via: 'contacts'
    }*/

  }

};

module.exports = User;
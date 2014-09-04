/**
* Room.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

var Room = {

  attributes: {

    jabberID: {
      type: 'string',
      required: true,
      unique: true
    },

    nickname: {
      type: 'string',
      required: true
    },

    users : {
      collection: 'User',
      via: 'rooms',
      dominant: true
    }

  }

};

module.exports = Room;

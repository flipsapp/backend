/**
* Room.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

var Room = {

  attributes: {

    name: {
      type: 'string',
      required: true
    },

    admin: {
      model: 'User',
      required: true
    },

    participants : {
      collection: 'User',
      via: 'rooms',
      dominant: true
    }
  }

};

module.exports = Room;

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

    birthdate: {
      type: 'date'
    },

    "facebookID": {
      "type": 'string'
    },

    photoUrl: {
      type: 'url'
    }
  }
};

module.exports = User;
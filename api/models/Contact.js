/**
* Contact.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {

    owner: {
      model: 'User',
      required: true
    },

    firstName: {
      type: 'string'
    },

    lastName: {
      type: 'string'
    },

    phoneNumbers: {
      collection: 'ContactPhoneNumber',
      via: 'contact'
    },

    isMugchatUserWithId: {
      model: 'User'
    }

  }
};


/**
* Invitation.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {

    code : {
      type: 'string',
      required: true,
      index: true
    },

    phoneNumber: {
      type: 'string',
      required: true
    },

    invitedBy: {
      model : 'user',
      required: true
    },

    clickedInvitation: {
      type: 'boolean',
      required: true,
      defaultsTo: false
    }

  }
};


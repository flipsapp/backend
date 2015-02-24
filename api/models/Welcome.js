/**
* Welcome.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {

    sequence: {
      type: 'integer',
      required: true
    },

    word: {
      type: 'string',
      required: true
    },

    thumbnailURL: {
      type: 'string',
      required: true
    },

    backgroundURL: {
      type: 'string',
      required: true
    }

  }
};


/**
 * Mug.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

var Mug = {

  attributes: {

    word: {
      type: 'string',
      required: 'true',
      index: 'true'
    },

    mediaURL: {
      type: 'string'
    },

    soundURL: {
      type: 'string'
    },

    usedBy: {
      collection: 'User',
      via: 'mugs'
    },

    isPrivate: {
      type: 'boolean'
    }

  }

};

module.exports = Mug;
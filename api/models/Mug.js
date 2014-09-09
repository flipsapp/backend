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
      required: true,
      index: true
    },

    backgroundURL: {
      type: 'string'
    },

    soundURL: {
      type: 'string'
    },

    owner: {
      model: 'User'
    },

    isPrivate: {
      type: 'boolean',
      defaultsTo: true
    },

    category: {
      type: 'string'
    }

  }

};

module.exports = Mug;
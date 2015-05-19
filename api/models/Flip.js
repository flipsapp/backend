/**
 * Flip.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

var Flip = {

  connection: 'mysql_utf8bm4',

  attributes: {

    word: {
      type: 'string',
      required: true,
      index: true
    },

    backgroundURL: {
      type: 'string'
    },

    thumbnailURL: {
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
    },

    isDeleted: {
      type: 'boolean',
      defaultsTo: false
    }

  }

};

module.exports = Flip;
/**
* BuilderWord.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  connection: 'mysql_utf8bm4',

  attributes: {

    word: {
      type: "string",
      required: true
    }

  }
};


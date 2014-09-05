/**
 * MugController
 *
 * @description :: Server-side logic for managing Mugs
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var MugError = requires('>/api/utilities/MugError');

var MugController = {

  create: function (request, response) {
    var params = request.params,
      userId = params.id;

    Mug.create({
      word: params.word,
      mediaURL: params.mediaURL,
      soundURL: params.soundURL,
      isPrivate: params.isPrivate
    }).exec(function (err, mug) {
      if (err || !mug) {
        return response.badRequest(new MugError('Error trying to create mug', err));
      }
      User.findOne(userId).exec(function(err, user) {
        if (err) {
          return response.serverError(new MugError('Error trying to query user', err));
        }
        if (!user) {
          return response.notFount(new MugError('User not found'));
        }
        user.mugs.add(mug);
        user.save();
        return response.send(201, mug);
      });
    });
  }

};

module.exports = MugController;
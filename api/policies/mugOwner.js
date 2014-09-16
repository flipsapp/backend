var MugError = requires('>/api/utilities/MugError');

module.exports = function (request, response, next) {
  var userId = request.params.user_id;

  if (!request.user) {
    return response.send(403, new MugError('User must login first'));
  }

  if (userId == request.user.id) {
    return next();
  }

  return response.send(403, new MugError('This entity does not belong to you.'));
};


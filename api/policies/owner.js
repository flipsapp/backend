module.exports = function (request, response, next) {
  var owner = request.params.parentid || request.params.id;

  if (owner == request.user.id) {
    return next();
  }

  return response.send(403, new MugError('This entity does not belong to you.'));
};

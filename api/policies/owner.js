module.exports = function (request, response, next) {
  var id = request.params.id;

  if (id == request.user.id) {
    return next();
  }

  return response.send(403, new MugError('This entity does not belong to you.'));
};

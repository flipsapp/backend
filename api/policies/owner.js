module.exports = function (request, response, next) {
  var owner = request.params.parentid || request.params.id;

  if (!request.user) {
    return response.send(403, new MugError('No user in session.', 'Please, authenticate first.'));
  }

  if (owner == request.user.id) {
    return next();
  }

  return response.send(403, new MugError('You can not access this resource.'));
};

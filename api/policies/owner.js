module.exports = function (request, response, next) {
  var parentid = request.params.parentid;

  if (parentid == request.user.id) {
    return next();
  }

  return response.send(403, new MugError('This entity does not belong to you.'));
};

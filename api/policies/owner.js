module.exports = function (request, response, next) {
  var id = request.params.id;

  if (id == request.user.id) {
    return next();
  }

  return response.forbidden({ error: 'This entity does not belong to you.'} );
};

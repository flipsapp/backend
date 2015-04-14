module.exports = function (request, response, next) {

  if (request.user && request.user.isBlocked) {
    return response.send(421, new FlipsError('Account Disabled', 'Please contact Flips Support via www.flipsapp.com.'));
  } else {
    next();
  }

};
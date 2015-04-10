module.exports = function (request, response, next) {

  var appVersion = request.headers.app_version;

  if (!appVersion) {
    return response.send(400, new FlipsError('App Version Error', 'App version is undefined.'));
  }

  if (appVersion >= process.env.MINIMUM_APP_VERSION) {
    return next();
  } else {
    return response.send(420, new FlipsError('App Version Error', 'This version of Flips is no longer supported. Please update to the latest version in the App Store. Flips will now close.'));
  }

};
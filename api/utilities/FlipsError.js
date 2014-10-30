var FlipsError = function (error, details, code) {
  this.error = error;
  this.details = details;
  this.code = code;
  return this.toJSON;
};

module.exports = FlipsError;
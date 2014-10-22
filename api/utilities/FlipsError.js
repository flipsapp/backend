var FlipsError = function (error, details) {
  this.error = error;
  this.details = details;
  return this.toJSON;
};

module.exports = FlipsError;
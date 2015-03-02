var winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      handleExceptions: true,
      json: true,
      colorize: true,
      timestamp: true,
      level: 'error'
    })
  ]
});
logger.handleExceptions();

module.exports = logger;
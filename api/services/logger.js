var winston = require('winston');
require('winston-loggly');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      handleExceptions: true,
      json: true,
      colorize: true,
      timestamp: true,
      level: 'error'
    }),
    new (winston.transports.Loggly)({
      level: 'error',
      subdomain: process.env.LOGGLY_SUBDOMAIN,
      json: true,
      inputToken: process.env.LOGGLY_TOKEN,
      tags: ["NodeJS"]
    })
  ]
});
logger.handleExceptions();

module.exports = logger;

const winston = require("winston");

module.exports = function (req, res, next) {
    winston.info(req.method + ":" + req.originalUrl + " from " + req.connection.remoteAddress);
    next();
}

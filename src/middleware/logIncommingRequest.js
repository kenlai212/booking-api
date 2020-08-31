const logger = require("../common/logger").logger;

module.exports = function (req, res, next) {
    logger.info(req.method + ":" + req.originalUrl + " from " + req.connection.remoteAddress);
    next();
}

const utility = require("../utility");
const {logger} = utility;

module.exports = function (req, res, next) {
    //logger.info(req.method + ":" + req.originalUrl + " from " + req.connection.remoteAddress);
    next();
}

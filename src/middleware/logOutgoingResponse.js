const winston = require("winston");

module.exports = function (res) {
    res.on("finish", function () {
        winston.info("Response : " + res.statusCode + " " + res.statusMessage);
    });

    return res;
}
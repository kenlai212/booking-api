const jwt = require("jsonwebtoken");
const winston = require("winston");

require('dotenv').config();

module.exports = function (req, res, next) {

    const authHeader = req.headers["authorization"];
    const accessToken = authHeader && authHeader.split(" ")[1];

    if (accessToken == null) {
        return res.sendStatus(401);
    }

    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, targetUser) => {
        if (err) {
            winston.error("Error while verifying accessToken, running jwt.verify()", err);
            return res.sendStatus(403);
        } else {
            targetUser.accessToken = accessToken;

            req.user = targetUser;

            next();
        }
    });
}
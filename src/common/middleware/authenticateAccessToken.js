const jwt = require("jsonwebtoken");

const utility = require("../utility");
const {logger} = utility;

module.exports = function (req, res, next) {

    const authHeader = req.headers["authorization"];
    const accessToken = authHeader && authHeader.split(" ")[1];

    if (!accessToken) {
        return res.sendStatus(401);
    }

    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, claim) => {
        if (err) {
            logger.error("Error while verifying accessToken, running jwt.verify()", err);
            return res.sendStatus(403);
        } else {
            if(!claim.userId){
                logger.error("Access token missing userId");
                return res.sendStatus(403);
            }

            if(!claim.groups){
                logger.error("Access token missing groups");
                return res.sendStatus(403);
            }

            req.requestor = claim;

            next();
        }
    });
}
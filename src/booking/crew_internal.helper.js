const jwt = require("jsonwebtoken");

const crewService = require("../crew/crew.service");
const customError = require("../common/customError");

async function getCrew(crewId) {
    var user = new Object();
    jwt.verify(global.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, targetUser) => {
        if (err) {
            throw { name: customError.JWT_ERROR, message: err.message };
        } else {
            user = targetUser;
        }
    });

    try {
        return await crewService.findCrew({ "crewId": crewId }, user);
    } catch (err) {
        logger.error("crewService.findCrew error : ", err);
        throw err
    }
}

module.exports = {
    getCrew
}
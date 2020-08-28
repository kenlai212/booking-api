const jwt = require("jsonwebtoken");

const crewService = require("../crew/crew.service");
const customError = require("../errors/customError");

function getCrew(crewId) {
    var user = new Object();
    jwt.verify(global.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, targetUser) => {
        if (err) {
            throw { name: customError.JWT_ERROR, message: err.message };
        } else {
            user = targetUser;
        }
    });

    const input = {
        "crewId": crewId
    }

    try {
        return crewService.findCrew(input, user);
    } catch (err) {
        throw err
    }
}

module.exports = {
    getCrew
}
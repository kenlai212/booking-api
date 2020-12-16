const logger = require("../../common/logger").logger;

const bookingAPIUser = require("../../common/bookingAPIUser");
const crewService = require("../../crew/crew.service");

async function getCrew(crewId) {
    try {
        return await crewService.findCrew({ "crewId": crewId }, bookingAPIUser.userObject);
    } catch (err) {
        console.log(err);
        logger.error("crewService.findCrew error : ", err);
        throw err
    }
}

module.exports = {
    getCrew
}
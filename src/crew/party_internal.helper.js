const logger = require("../common/logger").logger;

const partyService = require("../party/party.service");
const bookingAPIUser = require("../common/bookingAPIUser");

async function getParty(partyId){
    try {
        return await partyService.getParty({ "partyId": partyId }, bookingAPIUser.userObject);
    } catch (error) {
        logger.error("partyService.getParty() error", error);
        throw error;
    }
}

module.exports = {
    getParty
}
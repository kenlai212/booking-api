const logger = require("../common/logger").logger;

const partyService = require("../party/party.service");
const bookingAPIUser = require("../common/bookingAPIUser");
const customError = require("../common/customError");

async function getParty(partyId){
    try {
        return await partyService.findParty({ "partyId": partyId }, bookingAPIUser.userObject);
    } catch (error) {
        console.log(error);

        logger.error("Error while running party_internal.helper.getParty()");
        logger.error("partyService.findParty() error", error);

        //throw error object directly from partyService.findParty(), should already include error.name, and error.message
        throw error;
    }
}

module.exports = {
    getParty
}
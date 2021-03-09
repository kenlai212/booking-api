const utility = require("../common/utility");
const {logger, customError} = utility;

const partyService = require("../party/party.service");

async function getParty(partyId, user){
    try {
        return await partyService.findParty({ "partyId": partyId }, user);
    } catch (error) {
        console.log(error);
        logger.error("Error while running party_internal.helper.getParty()");

        throw error;
    }
}

module.exports = {
    getParty
}
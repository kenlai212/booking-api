const utility = require("../common/utility");
const {logger} = utility;

const partyService = require("../party/party.service");

async function createNewParty(party, user){
    const input = {
        personalInfo: party.personalInfo,
        contact: party.contact,
        picture: party.picture
    }

    try {
        return await partyService.createNewParty(input, user);
    } catch (error) {
        console.log(error);
        logger.error("Error while running party_internal.helper.createNewParty()");

        throw error;
    }
}

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
    createNewParty,
    getParty
}
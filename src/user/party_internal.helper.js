const logger = require("../common/logger").logger;

const partyService = require("../party/party.service");

async function createNewParty(name, telephoneCountryCode, telephoneNumber, emailAddress, pictureUrl, user){
    input = {
        name: name,
        telephoneCountryCode: telephoneCountryCode,
        telephoneNumber: telephoneNumber,
        emailAddress: emailAddress,
        pictureUrl: pictureUrl
    }

    let party;
    try {
        party = await partyService.createNewParty(input, user);
    } catch (err) {
        logger.error("Error while call partyService.createNewParty : ", err);
        throw err;
    }

    return party
}

module.exports = {
    createNewParty
}
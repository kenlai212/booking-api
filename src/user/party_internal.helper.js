const logger = require("../common/logger").logger;

const partyService = require("../party/party.service");

async function createNewParty(input, user){
    try {
        return await partyService.createNewParty(input, user);
    } catch (err) {
        console.log(err);
        logger.error("Error while call partyService.createNewParty : ", err);
        throw err;
    }
}

module.exports = {
    createNewParty
}
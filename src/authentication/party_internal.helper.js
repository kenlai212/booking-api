const logger = require("../common/logger").logger;

const partyService = require("../party/party.service");
const bookingAPIUser = require("../common/bookingAPIUser");

async function getParty(partyId){
    try {
        return await partyService.findParty({ "partyId": partyId }, bookingAPIUser.userObject);
    } catch (error) {
        logger.error("partyService.findParty() error", error);
        throw error;
    }
}

async function updateProfile(partyId, profile){
    const input = {
        partyId: partyId,
        profile: profile
    }
    
    try{
        return await partyService.editProfile(input, bookingAPIUser.userObject);
    }catch (error){
        logger.error("partyService.getParty() error", error);
        throw error;
    }
}

module.exports = {
    getParty,
    updateProfile
}
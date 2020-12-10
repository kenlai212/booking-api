const logger = require("../common/logger").logger;

const occupancyService = require("../occupancy/occupancy.service");

async function checkAvailability(input, user){
    let result;
    try {
        result = await occupancyService.checkAvailability(input, user);
    } catch (err) {
        logger.error("Error while calling occupancyService.occupyAsset : ", err);
        throw err;
    }

    return result.isAvailable;
}

async function occupyAsset(input, user){
    try {
        return await occupancyService.occupyAsset(input, user);
    } catch (err) {
        logger.error("Error while calling occupancyService.occupyAsset : ", err);
        throw err;
    }
}

async function releaseOccupancy(input, user) {
    try {
        return await occupancyService.releaseOccupancy(input, user);
    } catch (err) {
        logger.error("Error while calling occupancyService.releaseOccupancy : ", err);
        throw err;
    }
}

module.exports = {
    checkAvailability,
    occupyAsset,
    releaseOccupancy
}
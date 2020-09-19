const logger = require("../common/logger").logger;

const bookingAPIUser = require("../common/bookingAPIUser");
const occupancyService = require("../occupancy/occupancy.service");

async function occupyAsset(startTime, endTime, utcOffset, assetId, occupancyType){
    input = {
        startTime: startTime,
        endTime: endTime,
        utcOffset: utcOffset,
        assetId: assetId,
        occupancyType: occupancyType
    }

    try {
        return await occupancyService.occupyAsset(input, bookingAPIUser.userObject);
    } catch (err) {
        logger.error("Error while call occupancyService.occupyAsset : ", err);
        throw err;
    }
}

async function releaseOccupancy(occupancyId) {
    input = { occupancyId: occupancyId }

    try {
        return await occupancyService.releaseOccupancy(input, bookingAPIUser.userObject);
    } catch (err) {
        logger.error("Error while call occupancyService.releaseOccupancy : ", err);
        reject(err);
    }
}

module.exports = {
    occupyAsset,
    releaseOccupancy
}
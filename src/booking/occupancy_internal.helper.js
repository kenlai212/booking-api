const logger = require("../common/logger").logger;

const bookingAPIUser = require("../common/bookingAPIUser");
const occupancyService = require("../occupancy/occupancy.service");

function occupyAsset(startTime, endTime, assetId, occupancyType){
    input = {
        startTime: startTime,
        endTime: endTime,
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

function releaseOccupancy(occupancyId) {
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
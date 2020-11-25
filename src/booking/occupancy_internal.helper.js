const logger = require("../common/logger").logger;

const bookingAPIUser = require("../common/bookingAPIUser");
const occupancyService = require("../occupancy/occupancy.service");

async function occupyAsset(startTime, endTime, utcOffset, assetId){
    input = {
        startTime: startTime,
        endTime: endTime,
        utcOffset: utcOffset,
        assetId: assetId
    }

    try {
        return await occupancyService.occupyAsset(input, bookingAPIUser.userObject);
    } catch (err) {
        logger.error("Error while call occupancyService.occupyAsset : ", err);
        throw err;
    }
}

async function linkBookingToOccupancy(occupancyId, bookingId, bookingType) {
    input = {
        occupancyId: occupancyId,
        bookingId: bookingId,
        bookingType: bookingType
    }

    try {
        return await occupancyService.updateBookingId(input, bookingAPIUser.userObject);
    } catch (err) {
        logger.error("Error while call occupancyService.updateBookingId : ", err);
        throw err;
    }
}

async function releaseOccupancy(bookingId, bookingType) {
    input = {
        bookingId: bookingId,
        bookingType: bookingType
    }
    
    try {
        return await occupancyService.releaseOccupancy(input, bookingAPIUser.userObject);
    } catch (err) {
        logger.error("Error while call occupancyService.releaseOccupancy : ", err);
        throw err;
    }
}

module.exports = {
    occupyAsset,
    releaseOccupancy,
    linkBookingToOccupancy
}
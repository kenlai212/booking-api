const logger = require("../common/logger").logger;

const bookingHistoryService = require("../bookingHistory/bookingHistory.service");

async function initBookingHistory(input, user) {
    try {
        return await bookingHistoryService.initBookingHistory(input, user);
    } catch (err) {
        logger.error("Error while call occupancyService.occupyAsset : ", err);
        throw err;
    }
}

async function addHistoryItem(input, user) {
    try {
        return await bookingHistoryService.addHistoryItem(input, user);
    } catch (err) {
        logger.error("Error while call occupancyService.occupyAsset : ", err);
        throw err;
    }
}

module.exports = {
    initBookingHistory,
    addHistoryItem
}
const logger = require("../common/logger").logger;

const bookingHistoryService = require("../bookingHistory/bookingHistory.service");

async function initBookingHistory(input, user) {
    try{
        await bookingHistoryService.initBookingHistory(input, user);
    }catch(error){
        console.log(error);
        logger.error("Error while calling bookingHistoryService.initBookingHistory : ", error);
        throw error;
    }
}

async function addHistoryItem(input, user) {
    try{
        await bookingHistoryService.addHistoryItem(input, user);
    }catch(error){
        console.log(error);
        logger.error("Error while calling bookingHistoryService.addHistoryItem : ", error);
        throw error;
    }
}

module.exports = {
    initBookingHistory,
    addHistoryItem
}
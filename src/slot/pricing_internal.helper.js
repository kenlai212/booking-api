const moment = require("moment");
const bookngAPIUser = require("../common/bookingAPIUser");

const logger = require("../common/logger").logger;
const pricingService = require("../pricing/pricing.service");

async function calculateTotalAmount(startTime, endTime, bookingType) {
    const input = {
        "startTime": moment(startTime).toISOString(),
        "endTime": moment(endTime).toISOString(),
        "bookingType": bookingType
    }

    try {
        return await pricingService.calculateTotalAmount(input, bookngAPIUser.userObject);
    } catch (err) {
        logger.error("pricingService.calculateTotalAmount error : ", err);
        throw err
    }
}

module.exports = {
    calculateTotalAmount
}
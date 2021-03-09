const moment = require("moment");
const bookngAPIUser = require("../common/bookingAPIUser");

const utility = require("../common/utility");
const {logger, customError} = utility;

const pricingService = require("../pricing/pricing.service");

async function calculateTotalAmount(startTime, endTime, utcOffset, bookingType) {
    const input = {
        "startTime": moment(startTime).toISOString(),
        "endTime": moment(endTime).toISOString(),
        "utcOffset": utcOffset,
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
const logger = require("../common/logger").logger;
const bookingAPIUser = require("../common/bookingAPIUser");
const pricingService = require("../pricing/pricing.service");

function calculateTotalAmount(startTime, endTime, utcOffset, bookingType){
    
    const pricingTotalAmountInput = {
        "startTime": startTime,
        "endTime": endTime,
        "utcOffset": utcOffset,
        "bookingType": bookingType
    }

    try {
        return pricingService.calculateTotalAmount(pricingTotalAmountInput, bookingAPIUser.userObject);
    } catch (err) {
        logger.error("Error while calling pricingService.calculateTotalAmount : ", err);
        throw err;
    }    
}

module.exports = {
    calculateTotalAmount
}
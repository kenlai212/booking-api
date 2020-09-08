const moment = require("moment");
const jwt = require("jsonwebtoken");

const logger = require("../common/logger").logger;
const pricingService = require("../pricing/pricing.service");
const customError = require("../common/customError");

async function calculateTotalAmount(startTime, endTime) {
    var user = new Object();
    await jwt.verify(global.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, targetUser) => {
        if (err) {
            logger.error("jwt.verify error : ", err);
            throw { name: customError.JWT_ERROR, message: err.message };
        } else {
            user = targetUser;
        }
    });

    const input = {
        "startTime": moment(startTime).toISOString(),
        "endTime": moment(endTime).toISOString()
    }

    try {
        return await pricingService.calculateTotalAmount(input, user);
    } catch (err) {
        logger.error("pricingService.calculateTotalAmount error : ", err);
        throw err
    }
}

module.exports = {
    calculateTotalAmount
}
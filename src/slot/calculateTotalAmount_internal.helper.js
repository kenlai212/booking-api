const moment = require("moment");
const jwt = require("jsonwebtoken");

const pricingService = require("../pricing/pricing.service");
const customError = require("../errors/customError");

function calculateTotalAmount(startTime, endTime) {

    var user = new Object();
    jwt.verify(global.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, targetUser) => {
        if (err) {
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
        return pricingService.calculateTotalAmount(input, user);
    } catch (err) {
        throw err
    }
    
}

module.exports = {
    calculateTotalAmount
}
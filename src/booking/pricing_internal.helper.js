const pricingService = require("../pricing/pricing.service");

function calculateTotalAmount(startTime, endTime, bookingType){
    var user = new Object();
    jwt.verify(global.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, targetUser) => {
        if (err) {
            throw { name: customError.JWT_ERROR, message: err.message };
        } else {
            user = targetUser;
        }
    });
    
    const pricingTotalAmountInput = {
        "startTime": booking.startTime,
        "endTime": booking.endTime,
        "bookingType": booking.bookingType
    }

    return pricingService.calculateTotalAmount(pricingTotalAmountInput, user);
}

module.exports = {
    calculateTotalAmount
}
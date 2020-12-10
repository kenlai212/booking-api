const logger = require("../common/logger").logger;

const customError = require("../common/customError");
const bookingService = require("../booking/booking.service");

async function findBooking(bookingId){
    try{
        return await bookingService.findBookingById({bookingId: bookingId});
    }catch(error){
        //return null if booking not found by bookingService.findBookingById()
        if(error.name == customError.RESOURCE_NOT_FOUND_ERROR){
            return null;
        }

        //every thing else, throw error
        logger.error("bookingService.findBookingById : ", err);
        throw err;
    }
}

module.exports = {
    findBooking
}
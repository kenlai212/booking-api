"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {BookingHistory} = require("./booking.model");

async function createBookingHistory(input){
    const schema = Joi.object({
		bookingId: Joi.string().required()
	});
	utility.validateInput(schema, input);

    let bookingHistory = new BookingHistory();
    bookingHistory.bookingId = input.bookingId;

    try{
        bookingHistory = await bookingHistory.save();
    }catch(error){
        logger.error("bookingHistory.save : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save BookingHistory Error" };
    }

    return bookingHistory;
}

async function readBookingHistory(bookingId){
    let bookingHistory;
    try{
        bookingHistory = await BookingHistory.findOne({bookingId: bookingId});
    }catch(error){
        logger.error("BookingHistory.findOne error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find BookingHistory Error" };
    }

    if(!bookingHistory)
    throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };

    return bookingHistory;
}

async function updateBookingHistory(bookingHistory){
    try{
        bookingHistory = await bookingHistory.save();
    }catch(error){
        logger.error("bookingHistory.save : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save BookingHistory Error" };
    }

    return bookingHistory;
}

async function deleteBookingHistory(bookingId){
    try{
        await BookingHistory.findOneAndDelete({bookingId: bookingId});
    }catch(error){
        logger.error("BookingHistory.findOneAndDelete error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete BookingHistory Error" };
    }

    return;
}

async function deleteAllBookingHistories(){
    try{
        await BookingHistory.deleteMany();
    }catch(error){
        logger.error("BookingHistory.deleteMany error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete BookingHistory Error" };
    }

    return;
}

module.exports = {
	createBookingHistory,
    readBookingHistory,
    updateBookingHistory,
    deleteBookingHistory,
    deleteAllBookingHistories
}
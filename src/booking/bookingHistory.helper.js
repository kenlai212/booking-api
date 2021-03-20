"use strict";

const utility = require("../common/utility");
const {logger, customError} = utility;

const {BookingHistory} = require("./bookingHistory.model");

async function findBookingHistory(bookingId){
    let bookingHistory;
	try {
		bookingHistory = await BookingHistory.findById(bookingId);
	} catch (error) {
		logger.error("BookingHistory.findOne Error", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find BookingHistory Error" };
	}
 
	if (!bookingHistory)
		throw { name: customError.BAD_REQUEST_ERROR, message: `Invalid bookingId(${input.bookingId})` };

    return bookingHistory
}

async function saveBookingHistory(bookingHistory){
    try {
		bookingHistory = await bookingHistory.save();
	} catch (error) {
		logger.error("bookingHistory.save Error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save BookingHistory Error" };
	}
}

function bookingHistoryToOutputObj(bookingHistory){
	let outputObj = new Object();
	outputObj.id = bookingHistory._id;
	outputObj.history = bookingHistory.history;

	return outputObj;
}

module.exports = {
	findBookingHistory,
    saveBookingHistory,
    bookingHistoryToOutputObj
}
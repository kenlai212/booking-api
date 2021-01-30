"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const customError = require("../common/customError");

const logger = require("../common/logger").logger;
const BookingHistory = require("./bookingHistory.model").BookingHistory;
const bookingHelper = require("./booking_internal.helper");

async function getBookingHistory(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	let bookingHistory;
	try {
		bookingHistory = await BookingHistory.findById(input.bookingId);
	} catch (error) {
		logger.error("BookingHistory.findOne Error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if(!bookingHistory)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };

	return bookingHistoryToOutputObj(bookingHistory);
}

async function initBookingHistory(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		transactionTime: Joi
			.date()
			.required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
		transactionDescription: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	let existingBookingHistory;
	try {
		existingBookingHistory = await BookingHistory.findById(input.bookingId);
	} catch (error) {
		logger.error("BookingHistory.findOne Error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (existingBookingHistory)
		throw { name: customError.BAD_REQUEST_ERROR, message: `Booking History(${existingBookingHistory._id}) alerady exist` };
	
	let bookingHistory = new BookingHistory();
	bookingHistory._id = input.bookingId;

	bookingHistory.history = [];
	const historyItem = {
		transactionTime: utility.isoStrToDate(input.transactionTime, input.utcOffset),
		transactionDescription: input.transactionDescription,
		userId: user.id,
		userName: user.name
	};
	bookingHistory.history.push(historyItem);
	
	try {
		bookingHistory = await bookingHistory.save();
	} catch (error) {
		logger.error("bookingHistory.save Error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return bookingHistoryToOutputObj(bookingHistory);
}

async function addHistoryItem(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		transactionTime: Joi
			.date()
			.required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
		transactionDescription: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	//find bookingHistory
	let bookingHistory;
	try {
		bookingHistory = await BookingHistory.findById(input.bookingId);
	} catch (error) {
		logger.error("BookingHistory.findOne Error", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
 
	if (!bookingHistory)
		throw { name: customError.BAD_REQUEST_ERROR, message: `Invalid bookingId(${input.bookingId})` };

	//set new history item
	const historyItem = {
		transactionTime: utility.isoStrToDate(input.transactionTime, input.utcOffset),
		transactionDescription: input.transactionDescription,
		userId: user.id,
		userName: user.name
	};
	bookingHistory.history.push(historyItem);

	//save booking history
	try {
		bookingHistory = await bookingHistory.save();
	} catch (error) {
		logger.error("bookingHistory.save Error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return bookingHistoryToOutputObj(bookingHistory);
}

function bookingHistoryToOutputObj(bookingHistory){
	let outputObj = new Object();
	outputObj.id = bookingHistory._id;
	outputObj.history = bookingHistory.history;

	return outputObj;
}

module.exports = {
	initBookingHistory,
	addHistoryItem,
	getBookingHistory
}
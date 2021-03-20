"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {BookingHistory} = require("./bookingHistory.model");
const bookingHistoryHelper = require("./bookingHistory.helper");

async function initBookingHistory(input, user) {
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
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find BookingHistory Error" };
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
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save BookingHistory Error" };
	}

	return bookingHistoryToOutputObj(bookingHistory);
}

async function addHistoryItem(input, user) {
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

	let bookingHistory = await bookingHistoryHelper.findBookingHistory(input.bookingHistory);

	//set new history item
	const historyItem = {
		transactionTime: utility.isoStrToDate(input.transactionTime, input.utcOffset),
		transactionDescription: input.transactionDescription,
		userId: user.id,
		userName: user.name
	};
	bookingHistory.history.push(historyItem);

	return await bookingHistoryHelper.saveBookingHistory(bookingHistory);
}

module.exports = {
	initBookingHistory,
	addHistoryItem
}
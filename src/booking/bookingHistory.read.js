"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {BookingHistory} = require("./bookingHistory.model");
const bookingHistoryHelper = require("./bookingHistory.helper");

async function getBookingHistory(input) {
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

	return bookingHistoryHelper.bookingHistoryToOutputObj(bookingHistory);
}

module.exports = {
	getBookingHistory
}
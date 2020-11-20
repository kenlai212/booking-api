"use strict";
const mongoose = require("mongoose");
const Joi = require("joi");
const moment = require("moment");

const customError = require("../common/customError")
const userAuthorization = require("../common/middleware/userAuthorization");
const logger = require("../common/logger").logger;
const BookingHistory = require("./bookingHistory.model").BookingHistory;
const bookingCommon = require("./booking.common");

async function initBookingHistory(input, user) {
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		transactionTime: Joi
			.date()
			.required(),
		transactionDescription: Joi
			.string()
			.required(),
		userId: Joi
			.string()
			.min(1),
		userName: Joi
			.string()
			.min(1)
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate bookingId
	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid bookingId" };
	}
	
	let bookingHistory = new BookingHistory();
	bookingHistory.bookingId = input.bookingId;

	bookingHistory.history = [];
	const historyItem = {
		transactionTime: moment(input.transactionTime).toDate(),
		transactionDescription: input.transactionDescription,
		userId: input.userId,
		userName: input.userName
	};
	bookingHistory.history.push(historyItem);

	try {
		bookingHistory = await bookingHistory.save();
	} catch (err) {
		logger.error("bookingHistory.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return bookingHistory;
}

async function addHistoryItem(input, user) {
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		transactionTime: Joi
			.date()
			.required(),
		transactionDescription: Joi
			.string()
			.required(),
		userId: Joi
			.string()
			.min(1),
		userName: Joi
			.string()
			.min(1)
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate bookingId
	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid bookingId" };
	}

	//find bookingHistory
	let bookingHistory;
	try {
		bookingHistory = await BookingHistory.findOne({ bookingId: input.bookingId});
	} catch (err) {
		logger.error("BookingHistory.findOne Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (bookingHistory == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	}

	//set new history item
	const historyItem = {
		transactionTime: moment(input.transactionTime).toDate(),
		transactionDescription: input.transactionDescription,
		userId: input.userId,
		userName: input.userName
	};
	bookingHistory.history.push(historyItem);

	//save booking history
	try {
		bookingHistory = await bookingHistory.save();
	} catch (err) {
		logger.error("bookingHistory.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return bookingHistory;
}

module.exports = {
	initBookingHistory,
	addHistoryItem
}
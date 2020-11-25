"use strict";
const mongoose = require("mongoose");
const Joi = require("joi");

const utility = require("../common/utility");
const customError = require("../common/customError")
const userAuthorization = require("../common/middleware/userAuthorization");
const logger = require("../common/logger").logger;
const BookingHistory = require("./bookingHistory.model").BookingHistory;

const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";

async function getBookingHistory(input, user) {
	const rightsGroup = [
		BOOKING_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate bookingId
	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid bookingId" };
	}

	let bookingHistory;
	try {
		bookingHistory = await BookingHistory.findOne({ bookingId: input.bookingId });
	} catch (err) {
		logger.error("BookingHistory.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (bookingHistory == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	}

	return bookingHistory;
}

async function initBookingHistory(input, user) {
	const rightsGroup = [
		BOOKING_ADMIN_GROUP
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
		utcOffset: Joi.number().min(-12).max(14).required(),
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

	let existingBookingHistory;
	try {
		existingBookingHistory = await BookingHistory.findOne({ bookingId: input.bookingId });
	} catch (err) {
		logger.error("BookingHistory.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (existingBookingHistory != null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: `Booking History for bookingId : ${existingBookingHistory._id} alerady exist` };
	}
	
	let bookingHistory = new BookingHistory();
	bookingHistory.bookingId = input.bookingId;

	bookingHistory.history = [];
	const historyItem = {
		transactionTime: utility.isoStrToDate(input.transactionTime, input.utcOffset),
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
		BOOKING_ADMIN_GROUP
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
		utcOffset: Joi.number().min(-12).max(14).required(),
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
		transactionTime: utility.isoStrToDate(input.transactionTime, input.utcOffset),
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
	addHistoryItem,
	getBookingHistory
}
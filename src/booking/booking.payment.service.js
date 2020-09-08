"use strict";
const mongoose = require("mongoose");
const moment = require("moment");

const Booking = require("./booking.model").Booking;
const bookingCommon = require("./booking.common");
const logger = require("../common/logger").logger;

const PAID_STATUS = "PAID";

/**
 * By : Ken Lai
 * Date : July 3, 2020
 * 
 */
async function makePayment(input, user) {
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		paidAmount: Joi
			.number()
			.required(),
		bookingId: Joi
			.string()
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//valid booking id
	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	}

	//find booking
	let booking;
	try {
		booking = await Booking.findById(input.bookingId);
	} catch (err) {
		logger.error("Booking.findById Error : ", err);
		reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
	}

	//if no booking found, it's a bad bookingId,
	if (booking == null) {
		reject({ name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" });
	}

	booking.paymentStatus = PAID_STATUS;
	booking.paidAmount = Number(input.paidAmount);

	//add transaction history
	var transactionHistory = new Object();
	transactionHistory.transactionTime = moment().toDate();
	transactionHistory.userId = user.id;
	transactionHistory.userName = user.name;
	transactionHistory.transactionDescription = "Payment status made changed to PAID";
	booking.history.push(transactionHistory);

	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save() Error : ", err);
		reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
	}

	return bookingCommon.bookingToOutputObj(booking);
}

/**
 * By : Ken Lai
 * Date : July 27, 2020
 * 
 */
async function applyDiscount(input, user) {
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
		discountAmount: Joi
			.number()
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

	//find booking
	let booking;
	try {
		booking = await Booking.findById(input.bookingId); 
	} catch (err) {
		logger.error("Booking.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (booking == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	}

	booking.discountedAmount = input.discountedAmount;

	//add transaction history
	var transactionHistory = new Object();
	transactionHistory.transactionTime = mament().toDate();
	transactionHistory.userId = user.id;
	transactionHistory.userName = user.name;
	transactionHistory.transactionDescription = "Gave discount. Final discounted amount : " + booking.discountedAmount;
	booking.history.push(transactionHistory);

	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return bookingCommon.bookingToOutputObj(booking);
}

module.exports = {
	makePayment,
	applyDiscount,
}


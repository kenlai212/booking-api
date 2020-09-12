"use strict";
const Joi = require("joi");
var uuid = require("uuid");
const moment = require("moment");
const mongoose = require("mongoose");

const customError = require("../common/customError");
const userAuthorization = require("../common/middleware/userAuthorization");
const logger = require("../common/logger").logger;

const bookingCommon = require("./booking.common");
const Booking = require("./booking.model").Booking;
const notificationHelper = require("./notification_internal.helper");

/**
 * By: Ken Lai
 * Date : July 28, 2020
 * 
 * Public api. Customer can signDisclaimer without signing in 
 */
async function signDisclaimer(input) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		disclaimerId: Joi
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

	//find booking
	let booking;
	try {
		booking = await Booking.findById(input.bookingId);
	} catch (err) {
		logger.error("Booking.findById Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//if no booking found, it's a bad bookingId,
	if (booking == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	}

	var guestFound = false;
	var guestId;
	booking.guests.forEach(guest => {
		if (guest.disclaimerId == input.disclaimerId) {
			guestFound = true;
			guestId = guest._id;
			guest.signedDisclaimerTimeStamp = moment().toDate();
		}
	});

	if (guestFound == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid disclaimerId" };
	}

	//add transaction history
	var transactionHistory = new Object();
	transactionHistory.transactionTime = moment().toDate();
	transactionHistory.transactionDescription = "Guest signed disclaimer. GuestId : " + guestId;
	booking.history.push(transactionHistory);

	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return bookingCommon.bookingToOutputObj(booking);
}

/**
 * By : Ken Lai
 * Date: July 12, 2020
 */
async function sendDisclaimer(input, user) {
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
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
		guestId: Joi
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

	//find booking
	let booking;
	try {
		booking = await Booking.findById(input.bookingId);
	} catch (err) {
		logger.error("Booking.findById Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//if no booking found, it's a bad bookingId,
	if (booking == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	}

	//find target guest from booking.guests list, assign disclaimerId
	let guest;
	booking.guests.forEach(item => {
		if (item._id == input.guestId) {
			item.disclaimerId = uuid.v4();
			guest = item;
		}
	});

	if (guest == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid guestId" };
	}

	//update guest.disclaimerId
	var transactionHistory = new Object();
	transactionHistory.transactionTime = moment().toDate();
	transactionHistory.userId = user.id;
	transactionHistory.userName = user.name;
	transactionHistory.transactionDescription = "Send disclaimer to guest : " + guest.guestName + "(" + guest.telephoneNumber + ")";
	booking.history.push(transactionHistory);

	//save booking
	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save() Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//send disclaimer notification
	try {
		return await notificationHelper.sendDisclaimerNotification(booking._id, guest.disclaimerId, guest.telephoneNumber);
	} catch (err) {
		logger.error("notificationHelper.sendDisclaimerNotification Error", err);
		throw err;
	}
}

module.exports = {
	signDisclaimer,
	sendDisclaimer
}
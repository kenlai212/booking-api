"use strict";
const mongoose = require("mongoose");
const moment = require("moment");
const Joi = require("joi");

const customError = require("../common/customError");
const logger = require("../common/logger").logger;
const userAuthorization = require("../common/middleware/userAuthorization");

const bookingCommon = require("./booking.common");

const Booking = require("./booking.model").Booking;

/**
 * By : Ken Lai
 * Date : Jul 24, 2020
 */
async function editHost(input, user) {
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
			.min(1)
			.required(),
		hostName: Joi
			.string()
			.min(1)
			.max(255),
		telephoneCountryCode: Joi
			.string()
			.valid("852", "853", "86"),
		telephoneNumber: Joi
			.string()
			.min(7),
		emailAddress: Joi
			.string()
			.min(1)
			.max(255)
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

	if (booking == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	}

	//thow bad request if no contact attribute in input
	if (
		(input.hostName == null) &&
		(input.telephoneCountryCode == null) &&
		(input.telephoneNumber == null)) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Nothing to change for Contact" };
	}

	//set contactName if provided in input
	if (input.hostName != null) {
		booking.host.hostName = input.hostName;
	}

	//set telephoneCountryCode if provided in input
	if (input.telephoneCountryCode != null && input.telephoneCountryCode.length > 0) {
		booking.contact.telephoneCountryCode = input.telephoneCountryCode;
	}

	if (input.telephoneNumber != null && input.telephoneNumber.length > 0) {
		booking.contact.telephoneNumber = input.telephoneNumber;
	}

	//set emailAddress
	if (input.emailAddress != null && input.emailAddress.length > 0) {
		booking.contact.emailAddress = input.emailAddress;
	}

	//add transaction history
	booking.history.push({
		transactionTime: moment().toDate(),
		transactionDescription: "Edited host info",
		userId: user.id,
		userName: user.name
	});

	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return bookingCommon.bookingToOutputObj(booking);
}

module.exports = {
	editHost
}
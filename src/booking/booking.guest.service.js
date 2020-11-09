"use strict";
const Joi = require("joi");
const moment = require("moment");
const mongoose = require("mongoose");

const customError = require("../common/customError")
const bookingCommon = require("./booking.common");
const userAuthorization = require("../common/middleware/userAuthorization");
const logger = require("../common/logger").logger;
const Booking = require("./booking.model").Booking;

async function removeGuest(input, user) {
	//validate user group
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
		bookingId: Joi.string().min(1).required(),
		guestId: Joi.string().min(1).required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//check bookingId format
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

	//if no booking found, it's a bad bookingId,
	if (booking == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	}

	var targetGuest;
	if (booking.guests != null && booking.guests.length > 0) {
		booking.guests.forEach((guest, index, object) => {
			if (guest._id == input.guestId) {
				targetGuest = guest;
				object.splice(index, 1);
			}
		});
	}

	//validate guestId
	if (targetGuest == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Guest not found" };
	}

	//add transaction history
	if (booking.history == null) {
		booking.history = [];
	}
	booking.history.push({
		transactionTime: moment().toDate(),
		transactionDescription: "Removed guest : " + targetGuest.guestName,
		userId: user.id,
		userName: user.name
	});

	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	return bookingCommon.bookingToOutputObj(booking);
}

async function addGuest(input, user) {
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
		guestName: Joi
			.string()
			.required(),
		telephoneCountryCode: Joi
			.string()
			.valid("852", "853", "86")
			.required(),
		telephoneNumber: Joi.string().required()
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

	if (booking.guests == null) {
		booking.guests = [];
	}

	//check  if guest already exist
	var foundExistingGuest = false;
	booking.guests.forEach(guest => {
		if (guest.guestName == input.guestName &&
			guest.telephoneCountryCode == input.telephoneCountryCode &&
			guest.telephoneNumber == input.telephoneNumber
		) {
			foundExistingGuest = true;
		}
	});

	if (foundExistingGuest == true) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Guest already exist" };
	}

	//add guest
	const guest = {
		guestName: input.guestName,
		telephoneCountryCode: input.telephoneCountryCode,
		telephoneNumber: input.telephoneNumber,
		emailAddress: input.emailAddress
	}
	booking.guests.push(guest);

	//add transaction history
	if (booking.history == null) {
		booking.history = [];
	}
	booking.history.push({
		transactionTime: moment().toDate(),
		transactionDescription: `Added new guest : ${input.guestName}`,
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

/**
 * By : Ken Lai
 * Date : Jul 23, 2020
 */
async function editGuest(input, user) {
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
			.required(),
		guestName: Joi
			.string()
			.required(),
		telephoneCountryCode: Joi
			.string()
			.valid("852", "853", "86")
			.required(),
		telephoneNumber: Joi.string().required()
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
	booking.guests.forEach(guest => {
		if (guest._id == input.guestId) {
			guestFound = true;

			guest.guestName = input.guestName;
			guest.telephoneCountryCode = input.telephoneCountryCode;
			guest.telephoneNumber = input.telephoneNumber;
			guest.emailAddress = input.emailAddress;
		}
	});

	if (guestFound == false) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid guestId" };
	}

	//add transaction history
	booking.history.push({
		transactionTime: moment().toDate(),
		transactionDescription: "Edited guest : " + input.guestName,
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
	addGuest,
	removeGuest,
	editGuest
}
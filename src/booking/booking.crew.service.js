"use strict";
const mongoose = require("mongoose");

const logger = require("../common/logger").logger;
const userAuthorization = require("../common/middleware/userAuthorization");
const Booking = require("./booking.model").Booking;
const crewHelper = require("./crew_internal.helper");
const bookingCommon = require("./booking.common");

async function addCrew(input, user) {
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
		crewId: Joi
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
		logger.error("Booking.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//if no booking found, it's a bad bookingId,
	if (booking == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	}

	//find target crew
	let crew;
	try {
		crew = await crewHelper.getCrew(input.crewId);
	} catch (err) {
		logger.error("crewHelper.getCrew Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	if (crew == null || crew.id == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid crewId" };
	}

	//add crew
	if (booking.crews == null) {
		booking.crews = new Array();
	}

	booking.crews.push({
		crewId: crew.id,
		crewName: crew.crewName,
		telephoneCountryCode: crew.telephoneCountryCode,
		telephoneNumber: crew.telephoneNumber,
		assignmentTime: gogowakeCommon.getNowUTCTimeStamp(),
		assignmentBy: user.id
	});

	//add transaction history
	booking.history.push({
		transactionTime: gogowakeCommon.getNowUTCTimeStamp(),
		transactionDescription: "Added new crew : " + input.crewId,
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

module.exports = {
	addCrew
}
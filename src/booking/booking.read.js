"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Booking} = require("./booking.model");
const bookingHelper = require("./booking.helper");

async function viewBookings(input) {
	const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
	});
	utility.validateInput(schema, input);

	const startTime = utility.isoStrToDate(input.startTime, input.utcOffset);
	const endTime = utility.isoStrToDate(input.endTime, input.utcOffset);

	if (startTime > endTime) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "startTime cannot be later then endTime" };
	}
	
	let bookings;
	try {
		bookings = await Booking.find(
			{
				startTime: { $gte: startTime },
				endTime: { $lt: endTime }
			})
			.sort("startTime");
	} catch (err) {
		logger.error("Booking.find Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	var outputObjs = [];
	for (const booking of bookings) {
		const outputObj = await bookingHelper.bookingToOutputObj(booking);
		outputObjs.push(outputObj);
	}
	
	return {
		"count": outputObjs.length,
		"bookings": outputObjs
	};
}

async function findBookingById(input) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required()
	});
	utility.validateInput(schema, input);

	let booking;
	try {
		booking = await Booking.findById(input.bookingId);
	} catch (err) {
		logger.error("Booking.findById Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (!booking)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	
	return bookingHelper.bookingToOutputObj(booking);
}

module.exports = {
	viewBookings,
	findBookingById
}
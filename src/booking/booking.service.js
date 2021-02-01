"use strict";
const uuid = require('uuid');
const moment = require("moment");
const Joi = require("joi");

const utility = require("../common/utility");
const customError = require("../common/customError");
const logger = require("../common/logger").logger;

const bookingCommon = require("./booking.common");
const profileHelper = require("../common/profile/profile.helper");

const Booking = require("./booking.model").Booking;
const occupancyHelper = require("./occupancy_internal.helper");

//constants for booking types
const CUSTOMER_BOOKING_TYPE = "CUSTOMER_BOOKING";
const OWNER_BOOKING_TYPE = "OWNER_BOOKING";

async function bookNow(input, user) {
	//validate input data
	const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
		assetId: Joi.string().min(1).required(),
		bookingType: Joi
			.string()
			.valid(CUSTOMER_BOOKING_TYPE, OWNER_BOOKING_TYPE)
			.required(),
		crewId: Joi.string().min(1),
		customerId: Joi.string().allow(null),
		personalInfo: Joi.object().when("customerId", { is: null, then: Joi.required() }),
		contact: Joi.object().allow(null),
		picture: Joi.object().allow(null)
	});
	utility.validateInput(schema, input);

	if(!input.customerId && !input.personalInfo)
		throw { name: customError.BAD_REQUEST_ERROR, message: "customerId or personalInfo in mandatory" };

	//validate host data
	if(!input.customerId){
		profileHelper.validatePersonalInfoInput(input.personalInfo);

		if(input.contact)
			profileHelper.validateContactInput(input.contact);
	
		if(input.picture)
			profileHelper.validatePictureInput(input.picture);
	}

	//validate assetId
	if(input.assetId != "MC_NXT20"){
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid assetId" };
	}

	//TODO validate if user can do OWNER_BOOKING

	//set start and end time
	const startTime = utility.isoStrToDate(input.startTime, input.utcOffset);
	const endTime = utility.isoStrToDate(input.endTime, input.utcOffset);

	//check if endTime is earlier then startTime
	if (startTime > endTime) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "endTime cannot be earlier then startTime" };
	}

	if (input.bookingType == CUSTOMER_BOOKING_TYPE) {
		//check minimum booking duration, maximum booking duration, earliest startTime
		try {
			//bookingDurationHelper.checkMimumDuration(startTime, endTime);
			//bookingDurationHelper.checkMaximumDuration(startTime, endTime);
			//bookingDurationHelper.checkEarliestStartTime(startTime, UTC_OFFSET);
			//bookingDurationHelper.checkLatestEndTime(endTime, UTC_OFFSET);
		} catch (err) {
			throw { name: customError.BAD_REQUEST_ERROR, message: err };
		}
	}

	//check for retro booking (booing before current time)
	if (startTime < moment().toDate() || endTime < moment().toDate()) {
		throw{ name: customError.BAD_REQUEST_ERROR, message: "Booking cannot be in the past" };
	}

	const bookingId = uuid.v4();
	input.bookingId = bookingId;

	//save occupancy record
	const occupyAssetInput = {
		startTime: input.startTime,
		endTime: input.endTime,
		utcOffset: input.utcOffset,
		assetId: input.assetId,
		bookingId: bookingId,
		bookingType: input.bookingType
	}
	await occupancyHelper.occupyAsset(occupyAssetInput);

	//publish newBooking event
	try{
		utility.publishEvent(input, "newBooking");
	}catch(error){
		console.log(error);
		logger.err("utility.publishEvent error : ", error);

		//TODO rolling occupancy		

		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	return {bookingId: bookingId};
}

async function reschedule(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required()
	});
	utility.validateInput(schema, input);

	//get booking
	let booking;
	try{
		booking = await bookingCommon.getBooking(input.bookingId);
	}catch(error){
		throw error;
	}

	//TODO......
}

async function viewBookings(input, user) {
	//validate input data
	const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
	});
	
	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	const startTime = utility.isoStrToDate(input.startTime, input.utcOffset);
	const endTime = utility.isoStrToDate(input.endTime, input.utcOffset);

	if (startTime > endTime) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "startTime cannot be later then endTime" };
	}
	
	//get bookings
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
		const outputObj = await bookingCommon.bookingToOutputObj(booking);
		outputObjs.push(outputObj);
	}
	
	return {
		"count": outputObjs.length,
		"bookings": outputObjs
	};
}

async function findBookingById(input, user) {
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
	
	return bookingCommon.bookingToOutputObj(booking);
}

module.exports = {
	bookNow,
	viewBookings,
	findBookingById,
	reschedule
}
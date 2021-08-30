"use strict";
const Joi = require("joi");

const lipslideCommon = require("lipslide-common");
const {logger, customError} = lipslideCommon;

const wakesurfBookingDao = require("./wakesurfBooking.dao");
const {WakesurfBooking} = require("./wakesurfBooking.model");

const bookingHelper = require("./booking.helper");

const AWAITING_CONFIRMATION_STATUS = "AWAITING_CONFIRMATION";
const CONFIRMED_BOOKING_STATUS = "CONFIRMED";
const CANCELLED_STATUS = "CANCELLED";
const FULFILLED_STATUS = "FULFILLED"

const NEW_WAKESURFBOOKING_QUEUE_NAME = "NEW_WAKESURFBOOKING";
const CANCEL_BOOKING_QUEUE_NAME = "CANCEL_BOOKING";

async function newBooking(input) {
	const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
		boatId: Joi.string().required(),
		hostCustomerId: Joi.string().required(),
		captainStaffId: Joi.string()
	});
	lipslideCommon.validateInput(schema, input);

	bookingHelper.validateBookingType(input.bookingType);

	bookingHelper.validateBoatId(input.boatId);

	bookingHelper.validateCustomerId(input.hostCustomerId);
	
	if(input.captainStaffId)
	bookingHelper.validateStaffId(input.captainStaffId);

	const startTime = lipslideCommon.isoStrToDate(input.startTime, input.utcOffset);
	const endTime = lipslideCommon.isoStrToDate(input.endTime, input.utcOffset);
	bookingHelper.validateBookingTime(startTime, endTime);

	//save occupancy
	const newOccupancyInput = {
		startTime: startTime,
		endTime: endTime,
		utcOffset: 0,
		assetType: "BOAT",
		assetId: input.boatId,
		referenceType: "BOOKING"
	}
	let occupancy = await bookingHelper.occupyAsset(newOccupancyInput);

	let wakesurfBooking = new WakesurfBooking();
	wakesurfBooking.occupancyId = occupancy.occupancyId;
	wakesurfBooking.bookingType = input.bookingType;
	wakesurfBooking.status = AWAITING_CONFIRMATION_STATUS;
	wakesurfBooking.hostCustomerId = input.hostCustomerId;

	if(input.captainStaffId)
	wakesurfBooking.captainStaffId = input.captainStaffId;

	wakesurfBooking = await wakesurfBookingDao.save(wakesurfBooking);

	//publish newBooking event
	let eventMessage = new Object();
	eventMessage.bookingId = wakesurfBooking._id;
	eventMessage.occupancyId = wakesurfBooking.occupancyId;

	await lipslideCommon.publishEvent(eventMessage, NEW_WAKESURFBOOKING_QUEUE_NAME, async () => {
		logger.error("rolling back new booking");
		
		await wakesurfBookingDao.del(wakesurfBooking._id);
	});

	logger.info(`Added new Booking(${wakesurfBooking._id})`);

	return bookingHelper.bookingToOutputObj(wakesurfBooking);
}

async function confirmBooking(input){
	const schema = Joi.object({
		bookingId: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

	let wakesurfBooking = await wakesurfBookingDao.find(input.bookingId);
	
	wakesurfBooking.status = CONFIRMED_BOOKING_STATUS;

	wakesurfBooking = await wakesurfBookingDao.save(wakesurfBooking);

	logger.info(`Confirmed Booking(${wakesurfBooking._id})`);

	return bookingHelper.bookingToOutputObj(wakesurfBooking);
}

async function fulfillBooking(input) {
	const schema = Joi.object({
		bookingId: Joi.string().required(),
		fulfilledHours: Joi.number().min(0.5).required()
	});
	lipslideCommon.validateInput(schema, input);

	let wakesurfBooking = await wakesurfBookingDao.find(input.bookingId);
	
	if (wakesurfBooking.status === FULFILLED_STATUS)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Booking already fulfilled" };

	if (input.fulfilledHours > wakesurfBooking.durationByHours)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Fulfilled Hours cannot be longer then booking duration" };

	if (wakesurfBooking.status === CANCELLED_STATUS)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot fulfilled a cancelled booking" };

	wakesurfBooking.fulfilledHours = input.fulfilledHours;
	wakesurfBooking.status = FULFILLED_STATUS;

	wakesurfBooking = await wakesurfBookingDao.save(wakesurfBooking);

	logger.info(`Fulfilled Booking(${wakesurfBooking._id})`);

	return bookingHelper.bookingToOutputObj(wakesurfBooking);
}

async function cancelBooking(input) {
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required()
	});
	lipslideCommon.validateInput(schema, input);

	let wakesurfBooking = bookingDao.find(input.bookingId);
	
	if (wakesurfBooking.status === CANCELLED_STATUS)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Booking already cancelled" };

	if (wakesurfBooking.status === FULFILLED_STATUS)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot cancel an already fulfilled booking" };

	const oldStatus = {...wakesurfBooking.status};

	wakesurfBooking.status = CANCELLED_STATUS;

	wakesurfBooking = await wakesurfBookingDao.save(wakesurfBooking);

	//publish cancelBooking event
	await lipslideCommon.publishEvent(input, CANCEL_BOOKING_QUEUE_NAME, async () => {
		logger.error("rolling back cancelBooking");
		
		wakesurfBooking.status = oldStatus;
		await wakesurfBookingDao.save(wakesurfBooking);
	});

	logger.info(`Cancelled Booking(${wakesurfBooking._id})`);

	return bookingHelper.bookingToOutputObj(wakesurfBooking);
}

async function searchBookings(input) {
	const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
	});
	lipslideCommon.validateInput(schema, input);

	const startTime = lipslideCommon.isoStrToDate(input.startTime, input.utcOffset);
	const endTime = lipslideCommon.isoStrToDate(input.endTime, input.utcOffset);

	if (startTime > endTime) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "startTime cannot be later then endTime" };
	}
	
	const wakesurfBookings = await wakesurfBookingDao.search(startTime, endTime);
	
	var outputObjs = [];
	for (const booking of wakesurfBookings) {
		const outputObj = await bookingHelper.bookingToOutputObj(booking);
		outputObjs.push(outputObj);
	}
	
	return {
		"count": outputObjs.length,
		"bookings": outputObjs
	};
}

async function findBooking(input) {
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required()
	});
	lipslideCommon.validateInput(schema, input);

	let wakesurfBooking = await wakesurfBookingDao.find(input.bookingId);
	
	return bookingHelper.bookingToOutputObj(wakesurfBooking);
}

async function deleteAllBookings(input){
	const schema = Joi.object({
		passcode: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

	if(process.env.NODE_ENV != "development")
	throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot perform this function" }

	if(input.passcode != process.env.GOD_PASSCODE)
	throw { name: customError.BAD_REQUEST_ERROR, message: "You are not GOD" }

	await wakesurfBookingDao.deleteAll();

	return {status: "SUCCESS"}
}

module.exports = {
	newBooking,
	confirmBooking,
	fulfillBooking,
	cancelBooking,
	searchBookings,
	findBooking,
	deleteAllBookings
}
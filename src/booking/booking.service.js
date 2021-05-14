"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const bookingDomain = require("./booking.domain");
const bookingHelper = require("./booking.helper");
const externalOccupancyHelper = require("./externalOccupancy.helper");

const AWAITING_CONFIRMATION_STATUS = "AWAITING_CONFIRMATION";
const CONFIRMED_BOOKING_STATUS = "CONFIRMED";
const CANCELLED_STATUS = "CANCELLED";
const FULFILLED_STATUS = "FULFILLED"

const NEW_BOOKING_QUEUE_NAME = "NEW_BOOKING";
const CANCEL_BOOKING_QUEUE_NAME = "CANCEL_BOOKING";

async function newBooking(input) {
	const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
		assetId: Joi.string().required(),
		bookingType: Joi.string().required(),
		customerId: Joi.string().required(),
		requestorId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	bookingHelper.validateBookingType(input.bookingType);

	bookingHelper.validateAssetId(input.assetId);

	const startTime = utility.isoStrToDate(input.startTime, input.utcOffset);
	const endTime = utility.isoStrToDate(input.endTime, input.utcOffset);
	bookingHelper.validateBookingTime(startTime, endTime);

	//save occupancy
	const newOccupancyInput = {
		startTime: startTime,
		endTime: endTime,
		utcOffset: 0,
		assetId: input.assetId,
		referenceType: "BOOKING"
	}

	let occupancy = await externalOccupancyHelper.occupyAsset(newOccupancyInput);

	//save booking to db
	let createBookingInput = new Object();
	createBookingInput.occupancyId = occupancy.occupancyId;
	createBookingInput.bookingType = input.bookingType;
	createBookingInput.requestorId = input.requestorId;
	createBookingInput.customerId = input.customerId;
	createBookingInput.status = AWAITING_CONFIRMATION_STATUS;
	
	let booking = await bookingDomain.createBooking(createBookingInput);

	//publish newBooking event
	let eventMessage = new Object();
	eventMessage.bookingId = booking._id;
	eventMessage.occupancyId = booking.occupancyId;
	eventMessage.startTime = booking.startTime;
	eventMessage.endTime = booking.endTime;

	if(input.customerId)
	eventMessage.customerId = input.customerId;

	await utility.publishEvent(eventMessage, NEW_BOOKING_QUEUE_NAME, async () => {
		logger.error("rolling back new booking");
		
		await bookingDomain.deleteBooking(booking._id);
	});

	logger.info(`Added new Booking(${booking._id})`);

	return bookingHelper.bookingToOutputObj(booking);
}

async function confirmBooking(input){
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required()
	});
	utility.validateInput(schema, input);

	let booking = await bookingDomain.readBooking(input.bookingId);
	
	booking.status = CONFIRMED_BOOKING_STATUS;

	booking = await bookingDomain.updateBooking(booking);

	logger.info(`Confirmed Booking(${booking._id})`);

	return bookingHelper.bookingToOutputObj(booking);
}

async function fulfillBooking(input) {
	const schema = Joi.object({
		bookingId: Joi.string().required(),
		fulfilledHours: Joi.number().min(0.5).required()
	});
	utility.validateInput(schema, input);

	let booking = await bookingDomain.readBooking(input.bookingId);
	
	if (booking.status === FULFILLED_STATUS)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Booking already fulfilled" };

	if (input.fulfilledHours > booking.durationByHours)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Fulfilled Hours cannot be longer then booking duration" };

	if (booking.status === CANCELLED_STATUS)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot fulfilled a cancelled booking" };

	booking.fulfilledHours = input.fulfilledHours;
	booking.status = FULFILLED_STATUS;

	booking = await bookingDomain.updateBooking(booking);

	logger.info(`Fulfilled Booking(${booking._id})`);

	return bookingHelper.bookingToOutputObj(booking);
}

async function cancelBooking(input) {
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required()
	});
	utility.validateInput(schema, input);

	let booking = bookingHelper.findBooking(input.bookingId);
	
	if (booking.status === CANCELLED_STATUS)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Booking already cancelled" };

	if (booking.status === FULFILLED_STATUS)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot cancel an already fulfilled booking" };

	const oldStatus = {...booking.status};

	booking.status = CANCELLED_STATUS;

	booking = await bookingDomain.updateBooking(booking);

	//publish cancelBooking event
	await utility.publishEvent(input, CANCEL_BOOKING_QUEUE_NAME, async () => {
		logger.error("rolling back cancelBooking");
		
		booking.status = oldStatus;
		await bookingDomain.updateBooking(booking);
	});

	logger.info(`Cancelled Booking(${booking._id})`);

	return bookingHelper.bookingToOutputObj(booking);
}

async function deleteAllBookings(input){
	const schema = Joi.object({
		passcode: Joi.string().required()
	});
	utility.validateInput(schema, input);

	if(process.env.NODE_ENV != "development")
	throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot perform this function" }

	if(input.passcode != process.env.GOD_PASSCODE)
	throw { name: customError.BAD_REQUEST_ERROR, message: "You are not GOD" }

	await bookingDomain.deleteAllBookings();

	return {status: "SUCCESS"}
}

module.exports = {
	newBooking,
	confirmBooking,
	fulfillBooking,
	cancelBooking,
	deleteAllBookings
}
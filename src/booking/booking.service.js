"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const bookingDomain = require("./booking.domain");
const bookingHelper = require("./booking.helper");

const AWAITING_CONFIRMATION_STATUS = "AWAITING_CONFIRMATION";
const CONFIRMED_BOOKING_STATUS = "CONFIRMED";
const CANCELLED_STATUS = "CANCELLED";
const FULFILLED_STATUS = "FULFILLED"

const NEW_BOOKING_QUEUE_NAME = "NEW_BOOKING";
const CANCEL_BOOKING_QUEUE_NAME = "CANCEL_BOOKING";

async function newBooking(input) {
	const schema = Joi.object({
		occupancyId: Joi.string().required(),
		bookingType: Joi.string().required(),
		customerId: Joi.string().required(),
		requestor: Joi.object().required()
	});
	utility.validateInput(schema, input);

	bookingHelper.validateBookingType(input.bookingType);
	
	//TODO validate if this user can preform this booking type

	let occupancy = await bookingHelper.validateOccupancyId(input.occupancyId);

	if(occupancy.status != "AWAITING_CONFIRMATION")
    throw { name: customError.BAD_REQUEST_ERROR, message: "Occupancy record not available" };
	
	//save booking to db
	let createBookingInput = new Object();
	createBookingInput.occupancyId = input.occupancyId;
	createBookingInput.startTime = occupancy.startTime;
	createBookingInput.endTime = occupancy.endTime;
	createBookingInput.bookingType = input.bookingType;
	createBookingInput.createdBy = input.requestor.id;
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

	return {
		status: "SUCCESS",
		message: `Published event to ${NEW_BOOKING_QUEUE_NAME} queue`,
		eventMsg: eventMessage
	};
}

async function confirmBooking(input, user){
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required()
	});
	utility.validateInput(schema, input);

	let booking = await bookingDomain.readBooking(input.bookingId);
	
	booking.status = CONFIRMED_BOOKING_STATUS;

	booking = await bookingDomain.updateBooking(booking);

	return booking;
}

async function fulfillBooking(input) {
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required(),
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

	return await bookingDomain.updateBooking(booking);
}

async function cancelBooking(input, user) {
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

	return {
		status: "SUCCESS",
		message: `Published event to ${CANCEL_BOOKING_QUEUE_NAME} queue`,
		eventMsg: {bookingId: booking._id, occupancyId: booking.occupancyId} 
	};
}

module.exports = {
	newBooking,
	confirmBooking,
	fulfillBooking,
	cancelBooking
}
"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const bookingDomain = require("./booking.domain");
const bookingHelper = require("./booking.helper");
const occupancyDomain = require("./occupancy.domain");

const CONFIRMED_BOOKING_STATUS = "CONFIRMED";
const CANCELLED_STATUS = "CANCELLED";
const FULFILLED_STATUS = "FULFILLED"

const NEW_BOOKING_QUEUE_NAME = "NEW_BOOKING";

async function bookNow(input, user) {
	const schema = Joi.object({
		occupancyId: Joi.string.min(1).required(),
		bookingType: Joi.string().required(),
		customerId: Joi.string.required(),
	});
	utility.validateInput(schema, input);

	bookingHelper.validateBookingType(input.bookingType);
	
	let occupancy = occupancyDomain.readOccupancy(input.occupancyId);

	//save booking to db
	const createBookingInput = {
		occupancyId : input.occupancyId,
	    startTime: occupancy.startTime,
		endTime: occupancy.startTime,
	    bookingType:  input.bookingType,
		createBy: user._id
	}
	
	let booking = await bookingDomain.createBooking(createBookingInput, user);

	//publish newBooking event
	let eventMessage;
	eventMessage.bookingId = booking._id;
	eventMessage.occupancyId = booking.occupancyId;
	eventMessage.startTime = booking.startTime;
	eventMessage.endTime = booking.endTime;

	if(input.customer)
	eventMessage.customerId = input.customerId;

	await utility.publishEvent(eventMessage, NEW_BOOKING_QUEUE_NAME, user, async () => {
		logger.error("rolling back new bookint");
		
		await bookingDomain.deleteBooking(booking._id);
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${NEW_BOOKING_QUEUE_NAME} queue`,
		eventMsg: input
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
	const eventQueueName = "cancelBooking";
	await utility.publishEvent(input, eventQueueName, user, async () => {
		logger.error("rolling back cancelBooking");
		
		input.status = oldStatus;
		await bookingDomain.updateStatus(input);
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
		eventMsg: booking
	};
}

module.exports = {
	bookNow,
	confirmBooking,
	fulfillBooking,
	cancelBooking
}
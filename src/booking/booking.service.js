"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Booking, BookingOccupancy} = require("./booking.model");
const bookingHelper = require("./booking.helper");

const AWAITING_CONFIRMATION_STATUS = "AWAITING_CONFIRMATION";
const CONFIRMED_BOOKING_STATUS = "CONFIRMED";
const CANCELLED_STATUS = "CANCELLED";
const FULFILLED_STATUS = "FULFILLED"

const CUSTOMER_BOOKING_TYPE = "CUSTOMER_BOOKING";
const OWNER_BOOKING_TYPE = "OWNER_BOOKING";

async function bookNow(input, user) {
	const schema = Joi.object({
		occupancyId: Joi.string.min(1).required(),
		bookingType: Joi
			.string()
			.valid(CUSTOMER_BOOKING_TYPE, OWNER_BOOKING_TYPE)
			.required(),
		customerId: Joi.string.min(1).allow(null)
	});
	utility.validateInput(schema, input);

	let bookingOccupancy;
	try{
		bookingOccupancy = await BookingOccupancy.findOne({_id: input.occupancyId});
	}catch(error){
		logger.error("BookingOccupancy.findOne error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find BookingOccupancy Error" };
	}

	if(!bookingOccupancy){
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid occuapncyId" };
	}

	//set and save booking object
	let booking = new Booking();
	booking.occupancyId = input.occupancyId;
	booking.creationTime = new Date();
	booking.createdBy = user._id,
	booking.bookingType = input.bookingType;
	booking.status = AWAITING_CONFIRMATION_STATUS;

	if(input.customerId){
		booking.hostCustomerId = input.customerId;
	}

	booking = await bookingHelper.saveBooking(booking);

	//publish newBooking event
	const eventQueueName = "newBooking";
	await utility.publishEvent(input, eventQueueName, user, async () => {
		logger.error("rolling back new bookint");
		
		try{
			await Booking.findOneAndDelete({ _id: booking._id });
		}catch(error){
			logger.error("findOneAndDelete error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find and Delete Booking Error" };
		}
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
		eventMsg: booking
	};
}

async function reschedule(input, user) {
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required()
	});
	utility.validateInput(schema, input);

	let booking = await bookingHelper.findBooking(input.bookingId);
	try{
		booking = await bookingCommon.getBooking(input.bookingId);
	}catch(error){
		throw error;
	}

	//TODO......
}

async function confirmBooking(input, user){
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required()
	});
	utility.validateInput(schema, input);

	let booking = await bookingHelper.findBooking(input.bookingId);
	
	booking.status = CONFIRMED_BOOKING_STATUS;

	return await bookingHelper.saveBooking(booking);
}

async function fulfillBooking(input) {
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required(),
		fulfilledHours: Joi.number().min(0.5).required()
	});
	utility.validateInput(schema, input);

	let booking = await bookingHelper.findBooking(input.bookingId);
	
	if (booking.status === FULFILLED_STATUS)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Booking already fulfilled" };

	if (input.fulfilledHours > booking.durationByHours)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Fulfilled Hours cannot be longer then booking duration" };

	if (booking.status === CANCELLED_STATUS)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot fulfilled a cancelled booking" };

	booking.fulfilledHours = input.fulfilledHours;
	booking.status = FULFILLED_STATUS;

	return await bookingHelper.saveBooking(booking);
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

	booking = bookingHelper.saveBooking(bookin);

	//publish cancelBooking event
	const eventQueueName = "cancelBooking";
	await utility.publishEvent(input, eventQueueName, user, async () => {
		logger.error("rolling back cancelBooking");
		
		booking.status = oldStatus;

		try{
			await booking.save();
		}catch(error){
			logger.error("findOneAndDelete error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find and Delete Booking Error" };
		}
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
		eventMsg: booking
	};
}

module.exports = {
	bookNow,
	reschedule,
	confirmBooking,
	fulfillBooking,
	cancelBooking
}
"use strict";
const moment = require("moment");
const Joi = require("joi");

const utility = require("../../common/utility");
const customError = require("../../common/customError");
const logger = require("../../common/logger").logger;

const bookingCommon = require("../booking.common");

const Booking = require("../booking.model").Booking;
const bookingHistoryHelper = require("../bookingHistory_internal.helper");
const bookingDurationHelper = require("../bookingDuration.helper");
const occupancyHelper = require("../occupancy_internal.helper");

//constants for booking status
const AWAITING_CONFIRMATION_STATUS = "AWAITING_CONFIRMATION";
const CONFIRMED_BOOKING_STATUS = "CONFIRMED";
const CANCELLED_STATUS = "CANCELLED";
const FULFILLED_STATUS = "FULFILLED"

async function initBooking(input, user){
	let booking = new Booking();
	booking.startTime = input.startTime;
	booking.endTime = input.endTime;
	booking.status = AWAITING_CONFIRMATION_STATUS;
	booking.bookingType = input.bookingType;
	booking.assetId = input.assetId;
	booking.durationByHours = bookingDurationHelper.calculateTotalDuration(input.startTime, input.endTime);
	booking.creationTime = moment().toDate();
	booking.createdBy = user.id;

	//save booking
	try {
		booking = await booking.save();
	} catch (err) {
		console.log(err);
		logger.error("booking.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//init bookingHistory
	const initBookingHistoryInput = {
		bookingId: booking._id.toString(),
		transactionTime: moment().utcOffset(0).format("YYYY-MM-DDTHH:mm:ss"),
		utcOffset:0,
		transactionDescription: "New booking"
	};

	bookingHistoryHelper.initBookingHistory(initBookingHistoryInput, user)
	.catch(() => {
		logger.error(`Booking(${booking._id.toString()}) successfully recorded, but failed to initBookingHistory ${JSON.stringify(initBookingHistoryInput)}. Please rub initBookingHistory manually.`);
	});
	
	return bookingCommon.bookingToOutputObj(booking);
}

async function confirmBooking(input, user){
	//validate input data
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required()
	});
	utility.validateInput(schema, input);

	//get booking
	let booking = await bookingCommon.getBooking(input.bookingId);

	//change status
	booking.status = CONFIRMED_BOOKING_STATUS;

	//update booking record
	const bookingOutput = await bookingCommon.saveBooking(booking);

	//add history item
	bookingCommon.addBookingHistoryItem(bookingOutput.id, `booking(${booking._id.toString()}) status changed to CONFIRMED`, user);

	return bookingOutput;
}

async function fulfillBooking(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required(),
		fulfilledHours: Joi.number().min(0.5).required()
	});
	utility.validateInput(schema, input);

	//get booking
	let booking = await bookingCommon.getBooking(input.bookingId);
	
	//check if booking if already fulfilled
	if (booking.status == FULFILLED_STATUS) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Booking already fulfilled" };
	}

	//check fulfilledHours not longer booking duration
	if (input.fulfilledHours > booking.durationByHours) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Fulfilled Hours cannot be longer then booking duration" };
	}

	//check if booking is cancelled
	if (booking.status == CANCELLED_STATUS) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot fulfilled a cancelled booking" };
	}

	booking.fulfilledHours = input.fulfilledHours;
	booking.status = FULFILLED_STATUS;

	//update booking record
	const bookingOutput = await bookingCommon.saveBooking(booking);

	//add history item
	bookingCommon.addBookingHistoryItem(bookingOutput.id, `booking(${booking._id.toString()}) status changed to FULFILLED`, user);

	return bookingOutput;
}

async function cancelBooking(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required()
	});
	utility.validateInput(schema, input);

	//get booking
	let booking = await bookingCommon.getBooking(input.bookingId);

	//check if booking is already CANCELLED
	if (booking.status == CANCELLED_STATUS) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Booking already cancelled" };
	}

	//check if booking is already FULFILLED
	if (booking.status == FULFILLED_STATUS) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot cancel an already fulfilled booking" };
	}

	//change booking status to cancel
	booking.status = CANCELLED_STATUS;

	//update booking record
	const bookingOutput = await bookingCommon.saveBooking(booking);

	//add history item
	bookingCommon.addBookingHistoryItem(bookingOutput.id, `booking(${booking._id.toString()}) status changed to CANCELLED`, user);

	//release occupancy
	const releaseOccupancyInput = {
        bookingId: booking._id.toString(),
        bookingType: booking.bookingType
	}
	
	occupancyHelper.releaseOccupancy(releaseOccupancyInput, user)
	.catch(()=>{
		logger.error(`Book(${booking._id.toString()}) status changed to CANCELLED, but failed to releaseOccupancy`);
	});

	return bookingOutput;
}

module.exports = {
    initBooking,
    confirmBooking,
    fulfillBooking,
    cancelBooking
}
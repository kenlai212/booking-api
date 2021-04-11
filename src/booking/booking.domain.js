"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Booking} = require("./booking.model");

async function createBooking(input){
    const schema = Joi.object({
        occupancyId : Joi.string.min(1).required(),
	    startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
	    bookingType = Joi.string.valid(CUSTOMER_BOOKING_TYPE, OWNER_BOOKING_TYPE),
        createdBy = Joi.string().required()
	});
	utility.validateInput(schema, input);

    //set and save booking object
	let booking = new Booking();
	booking.occupancyId = input.occupancyId;
	booking.startTime = input.startTime;
	booking.endTime = input.endTime;
	booking.creationTime = new Date();
	booking.createdBy = input.createdBy,
	booking.bookingType = input.bookingType;
	booking.status = AWAITING_CONFIRMATION_STATUS;

    try{
        booking = await booking.save();
    }catch(error){
        logger.error("booking.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Booking Error" };
    }

    return booking;
}

async function readBooking(bookingId){
    let booking;
	try {
		booking = await Booking.findById(bookingId);
	} catch (err) {
		logger.error("Booking.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Booking Error" };
	}

	if (!booking)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };

    return booking;
}

async function updateBooking(booking){
    try{
        booking = await booking.save();
    }catch(error){
        logger.error("booking.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Booking Error" };
    }

    return booking;
}

async function deleteBooking(bookingId){
    try{
        await Booking.findByIdAndDelete(bookingId);
    }catch(error){
        logger.error("Booking.findByIdAndDelete Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Booking Error" };
    }
}

module.exports = {
    createBooking,
    readBooking,
    updateBooking,
    deleteBooking
}
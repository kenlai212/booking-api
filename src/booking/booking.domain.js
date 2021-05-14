"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Booking} = require("./booking.model");

async function createBooking(input){
    const schema = Joi.object({
        requestorId: Joi.string().required(),
        occupancyId: Joi.string().required(),
        customerId: Joi.string().required(),
	    bookingType: Joi.string().required(),
        status: Joi.string().required()
	});
	utility.validateInput(schema, input);

    //set and save booking object
	let booking = new Booking();
	booking.occupancyId = input.occupancyId;
	booking.creationTime = new Date();
	booking.requestorId = input.requestorId;
    booking.customerId = input.customerId;
	booking.bookingType = input.bookingType;
	booking.status = input.status;

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

async function deleteAllBookings(){
    try {
		await Booking.deleteMany();
	} catch (err) {
		logger.error("Booking.deleteMany() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Bookings Error" }
	}

	return {status: "SUCCESS"}
}

module.exports = {
    createBooking,
    readBooking,
    updateBooking,
    deleteBooking,
    deleteAllBookings
}
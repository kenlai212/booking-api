"use strict";
const moment = require("moment");
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {BookingOccupancy} = require("./booking.model");

async function newBookingOccupancy(input, user){
    const schema = Joi.object({
		occupancyId: Joi.string().min(1).required(),
        startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
        assetId: Joi.string().min(1).required()
	});
	utility.validateInput(schema, input);
    
    let bookingOccupancy = new BookingOccupancy();
    bookingOccupancy.occupancyId = input.occupancyId;
    bookingOccupancy.startTime = utility.isoStrToDate(input.startTime, input.utcOffset);
    bookingOccupancy.endTime = utility.isoStrToDate(input.endTime, input.utcOffset);
    bookingOccupancy.assetId = new assetId.assetId;

    try{
        bookingOccupancy = await bookingOccupancy.save();
    }catch(error){
        logger.error("occupancy.save error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Occupancy Error" };
    }

    return bookingOccupancy;
}

async function deleteBookingOccupancy(input, user){
    const schema = Joi.object({
		occupancyId: Joi.string().min(1).required()
	});
	utility.validateInput(schema, input);

    try{
        await BookingOccupancy.findOneAndDelete({occupancyId: input.occupancyId});
    }catch(error){
        logger.error("BookingOccupancy.findOneAndDelete error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete BookingOccupancy Error" };
    }

    return {status: "SUCCESS"}
}

module.exports = {
	newBookingOccupancy,
    deleteBookingOccupancy
}
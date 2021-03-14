"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {SlotOccupancy} = require("./slot.model");
const slotOccupancyHelper = require("./slotOccupancy.helper");

async function newSlotOccupancy(input, user){
    const schema = Joi.object({
        occupancyId: Joi.string().min(1).required(),
        bookingType: Joi.date().iso().required(),
	    startTime: Joi.date().iso().required(),
	    endTime: Joi.date().iso().required(),
	    utcOffset: Joi.number().min(-12).max(14).required(),
        assetId: Joi.string().required()
	});
	utility.validateInput(schema, input);

    slotOccupancyHelper.validateAssetId(input.assetId);

    slotOccupancyHelper.validateBookingType(input.bookingType);

    const startTime = utility.isoStrToDate(input.startTime, input.utcOffset);
	const endTime = utility.isoStrToDate(input.endTime, input.utcOffset);
    slotOccupancyHelper.validateOccupancyTime(startTime, endTime, input.bookingType);

    let slotOccupancy = new SlotOccupancy();
    slotOccupancy.occupancyId = input.occupancyId;
    slotOccupancy.bookingType = input.bookingType;
    slotOccupancy.startTime = startTime;
    slotOccupancy.endTime = endTime;
    slotOccupancy.assetId = input.assetId;

    try{
        slotOccupancy = await SlotOccupancy.save();
    }catch(error){
        logger.error("SlotOccupancy.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save SlotOccupancy Error" };
    }

    return slotOccupancy;
}

module.exports = {
	newSlotOccupancy
}
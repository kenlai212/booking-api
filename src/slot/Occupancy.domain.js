"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Occupancy} = require("./slot.model");

async function createOccupancy(input){
    const schema = Joi.object({
        occupancyId: Joi.string().min(1).required(),
        bookingType: Joi.date().iso().required(),
	    startTime: Joi.date().iso().required(),
	    endTime: Joi.date().iso().required(),
	    utcOffset: Joi.number().min(-12).max(14).required(),
        assetId: Joi.string().required()
	});
	utility.validateInput(schema, input);

    let occupancy = new Occupancy();
    occupancy.occupancyId = input.occupancyId;
    occupancy.bookingType = input.bookingType;
    occupancy.startTime = startTime;
    occupancy.endTime = endTime;
    occupancy.assetId = input.assetId;

    try{
        occupancy = await Occupancy.save();
    }catch(error){
        logger.error("SlotOccupancy.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save SlotOccupancy Error" };
    }

    return occupancy;
}

async function readOccupancies(startTime, endTime){
    let occupancies;
	try {
		occupancies = await Occupancy.find({
			startTime: { $gte: startTime },
			endTime: { $lt: endTime },
			assetId: input.assetId
		})
	} catch (err) {
		logger.error("Occupancy.find Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Search Occupancy Error" };
	}

    return occupancies;
}

async function deleteOccupancy(occupancyId){
    try{
        await Occupancy.findByIdAndDelete(occupancyId);
    }catch(error){
        logger.error("Occupancy.findByIdAndDelete Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Occupancy Error" };
    }
}

module.exports = {
	createOccupancy,
    readOccupancies,
    deleteOccupancy
}
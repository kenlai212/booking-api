"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const Occupancy = require("./occupancy.model").Occupancy;

async function createOccupancy(input){
    const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		assetId: Joi.string().required(),
		bookingType: Joi.string().required(),
        status: Joi.string().required
	});
	utility.validateInput(schema, input);

    //set up occupancy object for saving
	var occupancy = new Occupancy();
	occupancy.startTime = input.startTime;
	occupancy.endTime = input.endTime;
	occupancy.assetId = input.assetId;
	occupancy.bookingType = input.bookingType;
    occupancy.status = input.status;

	try {
		occupancy = await occupancy.save();
	} catch (err) {
		logger.error("occupancy.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

    return occupancy;
}

async function readOccupancy(occupancyId){
    let occupancy;
	try {
		occupancy = await Occupancy.findById(occupancyId) 
	} catch (err) {
		logger.error("Occupancy.findById error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Occupancy Error" }
	}

	if (!occupancy)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid occupancyId" }

	return occupancy;
}

async function updateOccupancy(occupancy){
    try {
		occupancy = await occupancy.save();
	} catch (err) {
		logger.error("occupancy.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

    return occupancy;
}

async function deleteOccupancy(occupancyId){
    try {
		await Occupancy.findByIdAndDelete(occupancyId);
	} catch (err) {
		logger.error("Occupancy.findByIdAndDelete() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Occupancy.findByIdAndDelete not available" }
	}
}

module.exports = {
	createOccupancy,
    readOccupancy,
    updateOccupancy,
    deleteOccupancy
}
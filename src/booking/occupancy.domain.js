"use strict";
const moment = require("moment");
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Occupancy} = require("./booking.model");

async function createOccupancy(input){
    const schema = Joi.object({
		occupancyId: Joi.string().min(1).required(),
        startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
        assetId: Joi.string().min(1).required()
	});
	utility.validateInput(schema, input);
    
    let occupancy = new Occupancy();
    occupancy.occupancyId = input.occupancyId;
    occupancy.startTime = utility.isoStrToDate(input.startTime, input.utcOffset);
    occupancy.endTime = utility.isoStrToDate(input.endTime, input.utcOffset);
    occupancy.assetId = new assetId.assetId;

    try{
        occupancy = await occupancy.save();
    }catch(error){
        logger.error("occupancy.save error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Occupancy Error" };
    }

    return occupancy;
}

async function readOccupancy(occupancyId){
    let occupancy;
    try{
        occupancy = await Occupancy.findById(occupancyId);
    }catch(error){
        logger.error("Occupancy.findById error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Occupancy Error" };
    }

    if(!occupancy)
        throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid occupancyId" };
}

async function deleteOccupancy(occupancyId){
    try{
        await Occupancy.findOneAndDelete({occupancyId: occupancyId});
    }catch(error){
        logger.error("Occupancy.findOneAndDelete error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Occupancy Error" };
    }

    return {status: "SUCCESS"}
}

module.exports = {
	createOccupancy,
    readOccupancy,
    deleteOccupancy
}
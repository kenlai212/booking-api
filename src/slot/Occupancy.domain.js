"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Occupancy} = require("./slot.model");

async function createOccupancy(input){
    const schema = Joi.object({
		occupancyId: Joi.string().min(1).required(),
        startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
        assetId: Joi.string().required(),
        status: Joi.string().required(),
        referenceType: Joi.string().required()
	});
	utility.validateInput(schema, input);
    
    let occupancy = new Occupancy();
    occupancy.occupancyId = input.occupancyId;
    occupancy.startTime = utility.isoStrToDate(input.startTime, input.utcOffset);
    occupancy.endTime = utility.isoStrToDate(input.endTime, input.utcOffset);
    occupancy.assetId = input.assetId;
    occupancy.status = input.status;
    occupancy.referenceType = input.referenceType;

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
        occupancy = await Occupancy.findOne({occupancyId: occupancyId});
    }catch(error){
        logger.error("Occupancy.findById error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Occupancy Error" };
    }

    if(!occupancy)
        throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid occupancyId" };

    return occupancy;
}

async function updateOccupancy(occupancy){
    try{
        occupancy = await occupancy.save();
    }catch(error){
        logger.error("occupancy.save error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Occupancy Error" };
    }

    return occupancy;
}

async function deleteOccupancy(occupancyId){
    try{
        await Occupancy.findOneAndDelete({occupancyId: occupancyId});
    }catch(error){
        logger.error("Occupancy.findOneAndDelete error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Occupancy Error" };
    }

    return;
}

async function deleteAllOccupancies(){
    try{
        await Occupancy.deleteMany();
    }catch(error){
        logger.error("Occupancy.deleteMany error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Occupancy Error" };
    }

    return;
}

module.exports = {
	createOccupancy,
    readOccupancy,
    deleteOccupancy,
    updateOccupancy,
    deleteAllOccupancies
}
"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Occupancy} = require("./occupancy.model");

async function createOccupancy(input){
    const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		assetId: Joi.string().required(),
		referenceType: Joi.string().required(),
        status: Joi.string().required()
	});
	utility.validateInput(schema, input);

    //set up occupancy object for saving
	var occupancy = new Occupancy();
	occupancy.startTime = input.startTime;
	occupancy.endTime = input.endTime;
	occupancy.assetId = input.assetId;
	occupancy.referenceType = input.referenceType;
    occupancy.status = input.status;

	try {
		occupancy = await occupancy.save();
	} catch (err) {
		logger.error("occupancy.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Occupancy Error" };
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

async function readOccupancies(startTime, endTime, assetId){
	let occupancies;
	try {
		occupancies = await Occupancy.find({
			startTime: { $gte: startTime },
			endTime: { $lte: endTime },
			assetId: assetId
		})
	} catch (error) {
		logger.error("Occupancy.find Error", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Occupancies Error" };
	}
	
	return occupancies;
}

async function updateOccupancy(occupancy){
    try {
		occupancy = await occupancy.save();
	} catch (err) {
		logger.error("occupancy.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Occupany Error" };
	}

    return occupancy;
}

async function deleteOccupancy(occupancyId){
    try {
		await Occupancy.findByIdAndDelete(occupancyId);
	} catch (err) {
		logger.error("Occupancy.findByIdAndDelete() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Occupancy Error" }
	}
}

async function deleteAllOccupancies(){
	try {
		await Occupancy.deleteMany();
	} catch (err) {
		logger.error("Occupancy.deleteMany() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Occupancies Error" }
	}
}

module.exports = {
	createOccupancy,
    readOccupancy,
	readOccupancies,
    updateOccupancy,
    deleteOccupancy,
	deleteAllOccupancies
}
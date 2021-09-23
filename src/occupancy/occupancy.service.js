"use strict";
const Joi = require("joi");

const lipslideCommon = require("lipslide-common");
const {logger, customError} = lipslideCommon;

const occupancyDao = require("./occupancy.dao");
const {Occupancy} = require("./occupancy.model");

async function newOccupancy(input){
    const schema = Joi.object({
		occupancyId: Joi.string().required(),
		status: Joi.string().required(),
		referenceType: Joi.string(),
		referenceId: Joi.string()
	});
	lipslideCommon.validateInput(schema, input);

	const existingOccupancy = await occupancyDao.find(input.occupancyId);

	if(existingOccupancy){
		logger.error(`Occupancy(${input.occupancyId}) already exist`);
		throw { name: customError.BAD_REQUEST_ERROR, message: `Occupancy (${input.occupancyId}) already exist` }
	}

	let occupancy = new Occupancy();
	occupancy._id = input.occupancyId;

	occupancy.status = input.status;

	if(input.referenceType)
	occupancy.referenceType = input.referenceType;

	if(input.referenceId)
	occupancy.referenceId = input.referenceId;

	occupancy = await occupancyDao.save(occupancy);

    return occupancy; 
}

async function findOccupancy(input){
	const schema = Joi.object({
		occupancyId: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

	const occupancy = await occupancyDao.find(input.occupancyId);

	if(!occupancy)
	throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "No occupancy found" }

	return occupancy;
}

async function updateOccupancy(input){
	const schema = Joi.object({
		occupancyId: Joi.string().required(),
		referenceType: Joi.string().required(),
		referenceId: Joi.string().required(),
		status: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

	let occupancy = await occupancyDao.find(input.occupancyId);
	occupancy.referenceType = input.referenceType;
	occupancy.referenceId = input.referenceId;
	occupancy.status = input.status;

	occupancy = await occupancyDao.save(occupancy);

	return occupancy;
}

async function deleteOccupancy(input){
	const schema = Joi.object({
		occupancyId: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

    await occupancyDao.del(input.occupancyId);

	return {status: "SUCCESS"}
}

async function deleteAllOccupancies(input){
	const schema = Joi.object({
		passcode: Joi.string().required()
	});
	lipslideCommon.validateInput(schema, input);

	if(process.env.NODE_ENV != "development")
	throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot perform this function" }

	if(input.passcode != process.env.GOD_PASSCODE)
	throw { name: customError.BAD_REQUEST_ERROR, message: "You are not GOD" }

	await occupancyDao.deleteAll();

	logger.info("Delete all occupancy");

	return {status: "SUCCESS"}
}

module.exports = {
	newOccupancy,
	updateOccupancy,
	findOccupancy,
	deleteOccupancy,
	deleteAllOccupancies
}
"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const occupancyDomain = require("./occupancy.domain");

async function newOccupancy(input){
    const schema = Joi.object({
		occupancyId: Joi.string().required(),
        startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
        assetId: Joi.string().required(),
        status: Joi.string().required(),
		referenceType: Joi.string().required()
	});
	utility.validateInput(schema, input);

	const occupancy = await occupancyDomain.createOccupancy(input);

	logger.info(`Added new SlotOccupancy(${occupancy.occupancyId})`);

    return occupancy; 
}

async function deleteOccupancy(input){
    const schema = Joi.object({
		occupancyId: Joi.string().required()
	});
	utility.validateInput(schema, input);

    await occupancyDomain.deleteOccupancy(input.occupancyId);

	logger.info(`Released SlotOccupancy(${input.occupancyId})`);

	return {status: "SUCCESS"}
}

async function confirmOccupancy(input){
	const schema = Joi.object({
		occupancyId: Joi.string().required(),
		status: Joi.string().required()
	});
	utility.validateInput(schema, input);

	let occupancy = await occupancyDomain.readOccupancy(input.occupancyId);

	occupancy.status = input.status;

	occupancy = await occupancyDomain.updateOccupancy(occupancy);

	logger.info(`Confirmed SlotOccupancy(${input.occupancyId})`);

	return occupancy;
}

async function deleteAllOccupancies(input){
	const schema = Joi.object({
		passcode: Joi.string().required()
	});
	utility.validateInput(schema, input);

	if(process.env.NODE_ENV != "development")
	throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot perform this function" }

	if(input.passcode != process.env.GOD_PASSCODE)
	throw { name: customError.BAD_REQUEST_ERROR, message: "You are not GOD" }

	await occupancyDomain.deleteAllOccupancies();

	logger.info("Deleted all SlotOccupancies");

	return {status: "SUCCESS"}
}

module.exports = {
	newOccupancy,
    deleteOccupancy,
	confirmOccupancy,
	deleteAllOccupancies
}
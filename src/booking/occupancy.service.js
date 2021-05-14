"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const occupancyDomain = require("./occupancy.domain");

async function occupyAsset(input){
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

    return await occupancyDomain.createOccupancy(input);
}

async function releaseOccupancy(input){
    const schema = Joi.object({
		occupancyId: Joi.string().required()
	});
	utility.validateInput(schema, input);

    return await occupancyDomain.deleteOccupancy(input.occupancyId);
}

async function confirmOccupancy(input){
	const schema = Joi.object({
		occupancyId: Joi.string().required(),
		status: Joi.string().required()
	});
	utility.validateInput(schema, input);

	let occupancy = await occupancyDomain.readOccupancy(input.occupancyId);

	occupancy.status = input.status;

	return await occupancyDomain.updateOccupancy(occupancy);
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

	return {status: "SUCCESS"}
}

module.exports = {
	occupyAsset,
    releaseOccupancy,
	confirmOccupancy,
	deleteAllOccupancies
}
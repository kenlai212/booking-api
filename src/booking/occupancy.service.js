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

module.exports = {
	occupyAsset,
    releaseOccupancy,
	confirmOccupancy
}
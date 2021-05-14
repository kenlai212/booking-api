"use strict";
const Joi = require("joi");

const utility = require("../common/utility");

const occupancyService = require("../occupancy/occupancy.service");

async function occupyAsset(input){
    const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
		assetId: Joi.string().required(),
		referenceType: Joi.string().required()
	});
	utility.validateInput(schema, input);

	input.startTime = input.startTime.toISOString();
	input.endTime = input.endTime.toISOString();

    return await occupancyService.occupyAsset(input);
}

module.exports = {
	occupyAsset
}
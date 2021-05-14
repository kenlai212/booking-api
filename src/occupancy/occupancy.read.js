"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Occupancy} = require("./occupancy.model");
const occupancyHelper = require("./occupancy.helper");

async function getOccupancy(input){
	const schema = Joi.object({
		occupancyId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	let occupancy;
	try{
		occupancy = await Occupancy.findById(input.occupancyId);
	}catch(error){
		logger.error("Occupancy.findById Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Occupancy Error" };
	}

	if(occupancy)
	return occupancyHelper.occupancyToOutputObj(occupancy);
	else
	return null;
}

async function getOccupancies(input) {
	const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
		assetId: Joi.string().required()
	});
	utility.validateInput(schema, input);
	
	occupancyHelper.validateAssetId(input.assetId);

	const startTime = utility.isoStrToDate(input.startTime, input.utcOffset);
	const endTime = utility.isoStrToDate(input.endTime, input.utcOffset);

	if (startTime > endTime)
	throw { name: customError.BAD_REQUEST_ERROR, message: "endTime cannot be earlier then startTime" };

	let occupancies;
	try {
		occupancies = await Occupancy.find({
			startTime: { $gte: startTime },
			endTime: { $lt: endTime },
			assetId: input.assetId
		})
	} catch (err) {
		logger.error("Occupancy.find Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Occupancy Error" };
	}

	let outputObjs = [];
	occupancies.forEach(occupancy => {
		outputObjs.push(occupancyHelper.occupancyToOutputObj(occupancy));
	})

	return {
		"count": outputObjs.length,
		"occupancies": outputObjs
	};
}

module.exports = {
	getOccupancy,
	getOccupancies
}
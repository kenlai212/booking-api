"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Occupancy} = require("./occupancy.model");
const occupancyHelper = require("./occupancy.helper");

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
		logger.error("Internal Server Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//set outputObjs
	var outputObjs = [];
	occupancies.forEach((item) => {
		outputObjs.push(occupancyToOutputObj(item));

	});

	return {
		"count": outputObjs.length,
		"occupancies": outputObjs
	};
}

module.exports = {
	getOccupancies
}
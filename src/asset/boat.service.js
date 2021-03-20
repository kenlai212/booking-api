"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const {Boat} = require("./boat.model");

async function newBoat(input) {
	const schema = Joi.object({
		boatName: Joi
			.string()
			.required(),
		assetId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	let existingBoat;
	try {
		existingBoat = await Boat.findOne({ assetId: input.assetId });
	} catch (err) {
		logger.error("Boat.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (existingBoat)
		throw { name: customError.BAD_REQUEST_ERROR, message: `Boat with assetId(${input.assetId}) already exist` };

	let boat = new Boat();
	boat.lastUpdateTime = new Date()
	boat.boatName = input.boatName;
	boat.assetId = input.assetId;
	boat.fuelLevel = 0;
	
	//save to db
	try {
		boat = await boat.save();
	} catch (err) {
		logger.error("Internal Server Error : ", err);
		reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
	}

	return boatToOutputObj(boat);
}

async function setFuelLevel(input) {
	const schema = Joi.object({
		assetId: Joi
			.string()
			.required(),
		fuelLevel: Joi
			.number()
			.min(0)
			.max(100)
			.required()
	});
	utility.validateInput(schema, input);

	let boat;
	try {
		boat = await Boat.findOne({ assetId: input.assetId });
	} catch (err) {
		logger.error("Boat.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (!boat)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid assetId" };

	boat.fuelLevel = input.fuelLevel;
	boat.lastUpdateTime = new Date();

	try {
		boat = await boat.save();
	} catch (err) {
		logger.error("boat.save() Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return boatToOutputObj(boat);
}

async function findBoat(input) {
	const schema = Joi.object({
		assetId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	let boat;
	try {
		boat = await Boat.findOne({ assetId: input.assetId });
	} catch (err) {
		logger.error("Boat.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (!boat)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "None found" };

	return boatToOutputObj(boat);
}

function boatToOutputObj(boat) {
	var outputObj = new Object();
	outputObj.boatId = boat._id;
	outputObj.lastUpdateTime = boat.lastUpdateTime;
	outputObj.assetId = boat.assetId
	outputObj.boatName = boat.boatName;
	outputObj.fuelLevel = boat.fuelLevel;

	return outputObj;
}

module.exports = {
	newBoat,
	setFuelLevel,
	findBoat
}
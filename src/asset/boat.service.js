"use strict";
const Joi = require("joi");
const moment = require("moment");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const userAuthorization = require("../common/middleware/userAuthorization");
const Boat = require("./boat.model").Boat;

const ASSET_ADMIN_GROUP = "ASSET_ADMIN_GROUP";
const ASSET_USER_GROUP = "ASSET_USER_GROUP";

async function newBoat(input, user) {
	const rightsGroup = [
		ASSET_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		boatName: Joi
			.string()
			.required(),
		assetId: Joi
			.string()
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	let existingBoat;
	try {
		existingBoat = await Boat.findOne({ assetId: input.assetId });
	} catch (err) {
		logger.error("Boat.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (existingBoat != null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: `Boat with assetId(${input.assetId}) already exist` };
	}

	let boat = new Boat();
	boat.lastUpdateTime = moment().toDate();
	boat.boatName = input.boatName;
	boat.assetId = input.assetId;
	boat.fuelPercentage = 0;
	
	//save to db
	try {
		boat = await boat.save();
	} catch (err) {
		logger.error("Internal Server Error : ", err);
		reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
	}

	return boatToOutputObj(boat);
}

async function setFuelPercentage(input, user) {
	const rightsGroup = [
		ASSET_ADMIN_GROUP,
		ASSET_USER_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		assetId: Joi
			.string()
			.required(),
		fuelPercentage: Joi
			.number()
			.min(0)
			.max(100)
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	let boat;
	try {
		boat = await Boat.findOne({ assetId: input.assetId });
	} catch (err) {
		logger.error("Boat.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (boat == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid assetId" };
	}

	boat.fuelPercentage = input.fuelPercentage;
	boat.lastUpdateTime = moment().toDate();

	try {
		boat = await boat.save();
	} catch (err) {
		logger.error("boat.save() Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return boatToOutputObj(boat);
}

function boatToOutputObj(boat) {
	var outputObj = new Object();
	outputObj.boatId = boat._id;
	outputObj.lastUpdateTime = boat.lastUpdateTime;
	outputObj.assetId = boat.assetId
	outputObj.boatName = boat.boatName;
	outputObj.fuelPercentage = boat.fuelPercentage;

	return outputObj;
}

module.exports = {
	newBoat,
	setFuelPercentage
}
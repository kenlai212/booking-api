"use strict";
const Joi = require("joi");
const moment = require("moment");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const userAuthorization = require("../common/middleware/userAuthorization");
const FuelReservior = require("./fuelReservior.model").FuelReservior;

const ASSET_ADMIN_GROUP = "ASSET_ADMIN";
const ASSET_USER_GROUP = "ASSET_USER";

async function newFuelReservior(input, user) {
	const rightsGroup = [
		ASSET_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		reserviorName: Joi
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
	
	let existingReservior;
	try {
		existingReservior = await FuelReservior.findOne({ assetId: input.assetId });
	} catch (err) {
		logger.error("FuelReservior.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (existingReservior != null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: `FuelReservior with assetId(${input.assetId}) already exist` };
	}
	
	let fuelReservior = new FuelReservior();
	fuelReservior.lastUpdateTime = moment().toDate();
	fuelReservior.reserviorName = input.reserviorName;
	fuelReservior.assetId = input.assetId;
	fuelReservior.fullCanisters = 0;
	fuelReservior.emptyCanisters = 0;

	//save to db
	try {
		fuelReservior = await fuelReservior.save();
	} catch (err) {
		console.log("diu!!!!");
		logger.error("Internal Server Error : ", err);
		reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
	}

	return fuelReserviorToOutputObj(fuelReservior);
}

async function editCanisters(input, user) {
	const rightsGroup = [
		ASSET_ADMIN_GROUP
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
		fullCanisters: Joi
			.number()
			.min(0)
			.required(),
		emptyCanisters: Joi
			.number()
			.min(0)
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	let fuelReservior;
	try {
		fuelReservior = await FuelReservior.findOne({ assetId: input.assetId });
	} catch (err) {
		logger.error("fuelReservior.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (fuelReservior == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid assetId" };
	}

	fuelReservior.fullCanisters = input.fullCanisters;
	fuelReservior.emptyCanisters = input.emptyCanisters;

	try {
		fuelReservior = await fuelReservior.save();
	} catch (err) {
		logger.error("boat.save() Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return fuelReserviorToOutputObj(fuelReservior);
}

async function findFuelReservior(input, user) {
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
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	let fuelReservior;
	try {
		fuelReservior = await FuelReservior.findOne({ assetId: input.assetId });
	} catch (err) {
		logger.error("FuelReservior.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (fuelReservior == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "None found" };
	}

	return fuelReserviorToOutputObj(fuelReservior);
}

function fuelReserviorToOutputObj(fuelReservior) {
	var outputObj = new Object();
	outputObj.reserviorId = fuelReservior._id;
	outputObj.lastUpdateTime = fuelReservior.lastUpdateTime;
	outputObj.assetId = fuelReservior.assetId
	outputObj.fullCanisters = fuelReservior.fullCanisters;
	outputObj.emptyCanisters = fuelReservior.emptyCanisters;

	return outputObj;
}

module.exports = {
	newFuelReservior,
	editCanisters,
	findFuelReservior
}
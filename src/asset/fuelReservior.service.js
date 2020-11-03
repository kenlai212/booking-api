"use strict";
const Joi = require("joi");
const mongoose = require("mongoose");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const userAuthorization = require("../common/middleware/userAuthorization");
const FuelReservior = require("./fuelReservior.model");

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
	/*
	let existingReservior;
	try {
		existingReservior = await FuelReservior.findOne({ assetId: input.assetId });
	} catch (err) {
		logger.error("FuelReservior.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (existingReservior != null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: `FuelReservior with assetId(${input.assetId}) already exist` };
	}*/
	
	let fuelReservior = new FuelReservior();
	fuelReservior.lastUpdateTime = moment().toDate();
	fuelReservior.reserviorName = input.reserviorName;
	fuelReservior.assetId = input.assetId;
	fuelReservior.fullCanister = 0;
	fuelReservior.emptyCanister = 0;

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

function fuelReserviorToOutputObj(fuelReservior) {
	var outputObj = new Object();
	outputObj.reserviorId = fuelReservior._id;
	outputObj.lastUpdateTime = fuelReservior.lastUpdateTime;
	outputObj.assetId = fuelReservior.assetId
	outputObj.fullCanister = fuelReservior.fullCanister;
	outputObj.emptyCanister = fuelReservior.emptyCanister;

	return outputObj;
}

module.exports = {
	newFuelReservior
}
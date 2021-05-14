"use strict";
const Joi = require("joi");
require("dotenv").config();

const utility = require("../common/utility");
const {logger, customError} = utility;

const occupancyDomain = require("./occupancy.domain");
const occupancyHelper = require("./occupancy.helper");

const CONFIRMED_STATUS = "CONFIRMED";

const OCCUPY_ASSET_QUEUE_NAME = "OCCUPY_ASSET";
const RELEASE_OCCUPANCY_QUEUE_NAME = "RELEASE_OCCUPANCY";
const OCCUPANCY_CONFIRMED_QUEUE_NAME = "OCCUPANCY_CONFIRMED";

async function releaseOccupancy(input) {
	const schema = Joi.object({
		occupancyId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	let occupancy = await occupancyDomain.readOccupancy(input.occupancyId);

	//publish releaseOccupancy event
	await utility.publishEvent(input, RELEASE_OCCUPANCY_QUEUE_NAME);

	//delete from db
	await occupancyDomain.deleteOccupancy(occupancy._id);

	logger.info(`Released Occupancy(${input.occupancyId})`);

	return {status: "SUCCESS"}
}

async function occupyAsset(input) {
	const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
		assetId: Joi.string().required(),
		referenceType: Joi.string().required()
	});
	utility.validateInput(schema, input);

	occupancyHelper.validateAssetId(input.assetId);

	occupancyHelper.validateReferenceType(input.referenceType);

	const startTime = utility.isoStrToDate(input.startTime, input.utcOffset);
	const endTime = utility.isoStrToDate(input.endTime, input.utcOffset);

	occupancyHelper.validateOccupancyTime(startTime, endTime);

	const isAvailable = await occupancyHelper.checkAvailability(startTime, endTime, input.assetId);

	if (!isAvailable)
	throw { name: customError.BAD_REQUEST_ERROR, message: "Timeslot not available" };

	//save to db
	const createOccupancyInput = {
		startTime : startTime,
		endTime : endTime,
		assetId : input.assetId,
		referenceType : input.referenceType,
		status : "AWAITING_CONFIRMATION"
	}

	const occupancy = await occupancyDomain.createOccupancy(createOccupancyInput);

	//publish occupyAsset event
	const eventMsg = {
		occupancyId : occupancy._id,
		startTime : occupancy.startTime,
		endTime: occupancy.endTime,
		utcOffset: 0,
		assetId: occupancy.assetId,
		referenceType: occupancy.referenceType,
		status: occupancy.status
	}

	await utility.publishEvent(eventMsg, OCCUPY_ASSET_QUEUE_NAME, null, async () => {
		logger.error("rolling back occupyAsset");
		
		await occupancyDomain.deleteOccupancy(occupancy._id);
	});

	logger.info(`Occupied Asset - Occupancy(${occupancy._id})`);
	
	return occupancyHelper.occupancyToOutputObj(occupancy);
}

async function confirmOccupancy(input){
	const schema = Joi.object({
		occupancyId: Joi.string().required(),
		referenceType: Joi.string().required(),
		referenceId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	let occupancy = await occupancyDomain.readOccupancy(input.occupancyId);

	if(occupancy.status === CONFIRMED_STATUS)
	throw { name: customError.BAD_REQUEST_ERROR, message: "Occupancy already confirmed" };

	if(input.referenceType != occupancy.referenceType)
	throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid referencyType" };

	const oldStatus = {...occupancy.status};

	occupancy.status = CONFIRMED_STATUS;
	occupancy.referenceId = input.referenceId;

	occupancy = await occupancyDomain.updateOccupancy(occupancy);

	//publish OCCUPANCY_CONFIRMED event
	const eventMsg = {
		occupancyId : occupancy._id,
		status: occupancy.status
	}

	await utility.publishEvent(eventMsg, OCCUPANCY_CONFIRMED_QUEUE_NAME, async () => {
		logger.error("rolling back confirmOccupancy");
		
		occupancy.status = oldStatus;
		occupancy.referenceId = null;
		await occupancyDomain.updateOccupancy(occupancy);
	});

	logger.info(`Confirmed Occupancy(${occupancy._id})`);

	return occupancyHelper.occupancyToOutputObj(occupancy);
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

	logger.info("Deleted all occupancies");

	return {status: "SUCCESS"}
}

module.exports = {
	occupyAsset,
	releaseOccupancy,
	confirmOccupancy,
	deleteAllOccupancies
}
"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const occupancyDomain = require("./occupancy.domain");
const occupancyHelper = require("./occupancy.helper");

const OCCUPY_ASSET_QUEUE_NAME = "OCCUPY_ASSET";
const RELEASE_OCCUPANCY_QUEUE_NAME = "RELEASE_OCCUPANCY"

async function checkAvailability(input){
	const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
		assetId: Joi.string().required(),
		bookingType: Joi.string().required()
	});
	utility.validateInput(schema, input);

	occupancyHelper.validateAssetId(input.assetId);

	occupancyHelper.validateBookingType(input.bookingType);

	const startTime = utility.isoStrToDate(input.startTime, input.utcOffset);
	const endTime = utility.isoStrToDate(input.endTime, input.utcOffset);

	occupancyHelper.validateOccupancyTime(startTime, endTime);

	const isAvailable = await occupancyHelper.checkAvailability(startTime, endTime);

	return {isAvailable: isAvailable}
}

async function releaseOccupancy(input) {
	const schema = Joi.object({
		occupancyId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	let occupancy = occupancyDomain.readOccupancy(input.occupancyId);

	//publish releaseOccupancy event
	await utility.publishEvent(input, RELEASE_OCCUPANCY_QUEUE_NAME, user);

	//delete from db
	await occupancyDomain.deleteOccupancy(occupancy._id);

	return {
		status: "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
		eventMsg: input
	};
}

async function occupyAsset(input) {
	const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
		assetId: Joi.string().required(),
		bookingType: Joi.string().required()
	});
	utility.validateInput(schema, input);

	occupancyHelper.validateAssetId(input.assetId);

	occupancyHelper.validateBookingType(input.bookingType);

	const startTime = utility.isoStrToDate(input.startTime, input.utcOffset);
	const endTime = utility.isoStrToDate(input.endTime, input.utcOffset);

	occupancyHelper.validateOccupancyTime(startTime, endTime, input.bookingType);

	const isAvailable = await occupancyHelper.checkAvailability(startTime, endTime, occupancies);

	if (!isAvailable)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Timeslot not available" };

	//save to db
	const createOccupancyInput = {
		startTime : startTime,
		endTime : endTime,
		assetId : input.assetId,
		bookingType : input.bookingType,
		status : "AWAITING_CONFIRMATION"
	}

	const occupancy = await occupancyDomain.createOccupancy(createOccupancyInput);

	//publish occupyAsset event
	const eventMsg = {
		occupancyId : occupancy._id,
		startTime : occupancy.startTime,
		endTime: occupancy.endTime,
		utcOffset: input.utcOffset,
		assetId: occupancy.assetId,
		bookingType: occupancy.bookingType,
		status: occupancy.status
	}

	await utility.publishEvent(eventMsg, OCCUPY_ASSET_QUEUE_NAME, user, async () => {
		logger.error("rolling back occupyAsset");
		
		await occupancyDomain.deleteOccupancy(occupancy._id);
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
		eventMsg: eventMsg
	};
}

async function confirmOccupancy(input){
	const schema = Joi.object({
		occupancyId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	let occupancy = occupancyDomain.readOccupancy(input.occupancyId);

	const confirmedStatus = "CONFIRMED";

	if(occupancy.status === confirmedStatus)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Occupancy already confirmed" };

	occupancy.status = confirmedStatus;

	occupancy = await occupancyDomain.updateOccupancy(occupancy);

	return occupancy;
}

module.exports = {
	occupyAsset,
	releaseOccupancy,
	confirmOccupancy,
	checkAvailability
}
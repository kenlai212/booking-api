"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const Occupancy = require("./occupancy.model").Occupancy;
const occupancyHelper = require("./occupancy.helper");

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

	let occupancy;
	try {
		occupancy = await Occupancy.findById(inpt.occupancyId) 
	} catch (err) {
		logger.error("Occupancy.findById error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Occupancy Error" }
	}

	if (!occupancy)
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid occupancyId" }

	try {
		await Occupancy.findByIdAndDelete(occupancy._id);
	} catch (err) {
		logger.error("Occupancy.findByIdAndDelete() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Occupancy.findByIdAndDelete not available" }
	}

	//publish releaseOccupancy event
	const eventQueueName = "releaseOccupancy";
	await utility.publishEvent(input, eventQueueName, user, async () => {
		logger.error("rolling back releaseOccupancy");
		
		try{
			await occupancy.save();
		}catch(error){
			logger.error("occupancy.save error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Occupancy Error" };
		}
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
		eventMsg: {
			occupancyId: input.occupancyId
		}
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

	//set up occupancy object for saving
	var occupancy = new Occupancy();
	occupancy.startTime = startTime;
	occupancy.endTime = endTime;
	occupancy.assetId = input.assetId;
	occupancy.bookingType = input.bookingType;

	try {
		occupancy = await occupancy.save();
	} catch (err) {
		logger.error("occupancy.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//publish occupyAsset event
	const eventQueueName = "occupyAsset";
	await utility.publishEvent(input, eventQueueName, user, async () => {
		logger.error("rolling back occupyAsset");
		
		try{
			await Occupancy.findByIdAndDelete(occupancy._id);
		}catch(error){
			logger.error("Occupancy.findByIdAndDelete error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Rollback Delete Occupancy Error" };
		}
	});

	return {
		status: "SUCCESS",
		message: `Published event to ${eventQueueName} queue`,
		eventMsg: occupancy
	};
}

module.exports = {
	occupyAsset,
	releaseOccupancy,
	checkAvailability
}
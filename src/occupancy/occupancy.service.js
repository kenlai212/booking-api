"use strict";
const Joi = require("joi");
const moment = require('moment');
const mongoose = require("mongoose");

const utility = require("../common/utility");
const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const Occupancy = require("./occupancy.model").Occupancy;
const occupancyHelper = require("./occupancy.helper");

async function releaseOccupancy(input) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		bookingType: Joi
			.string()
			.valid("CUSTOMER_BOOKING","OWNER_BOOKING","MAINTAINANCE")
	});

	const result = schema.validate(input);
	if (result.error) {
		throw{ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') }
	}

	//validate bookingId
	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid bookingId" }
	}

	//find target occupancy
	let targetOccupancy;
	try {
		targetOccupancy = await Occupancy.findOne({ bookingId: input.bookingId, bookingType: input.bookingType }) 
	} catch (err) {
		logger.error("Occupancy.findOne() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Occupancy.findOne not available" }
	}

	if (targetOccupancy == null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid bookingId & bookingType" }
	}

	try {
		await Occupancy.findByIdAndDelete(targetOccupancy._id);
		return { "result": "SUCCESS" };
	} catch (err) {
		logger.error("Occupancy.findByIdAndDelete() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Occupancy.findOne not available" }
	}
}

async function occupyAsset(input) {
	//validate input data
	const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
		assetId: Joi
			.string()
			.required()
			.valid("A001", "MC_NXT20"),
		bookingId: Joi
			.string()
			.min(1),
		bookingType: Joi
			.string()
			.valid("CUSTOMER_BOOKING", "OWNER_BOOKING", "MAINTAINANCE",null)
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//check if bookingId is provided, bookingType is mandatorys
	if (input.bookingId != null) {

		//validate bookingId
		if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
			throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid bookingId" };
		}

		if (input.bookingType == null) {
			throw { name: customError.BAD_REQUEST_ERROR, message: "bookingType is mandatory" };
		}
	}

	const startTime = utility.isoStrToDate(input.startTime, input.utcOffset);
	const endTime = utility.isoStrToDate(input.endTime, input.utcOffset);

	//startTime cannot be later then endTime
	if (startTime > endTime) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "endTime cannot be earlier then startTime" };
	}

	//find all occupancies with in search start and end time
	//expand search range to -1 day from startTime and +1 from endTime 
	const searchTimeRangeStart = moment(startTime).subtract(1, 'days');
	const searchTimeRangeEnd = moment(endTime).add(1, 'days');

	let occupancies;
	try {
		occupancies = await Occupancy.find(
			{
				startTime: { $gte: searchTimeRangeStart },
				endTime: { $lt: searchTimeRangeEnd },
				assetId: input.assetId
			})
	} catch (err) {
		logger.error("Occupancy.find Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//check availibility, if false, reject
	const isAvailable = occupancyHelper.checkAvailability(startTime, endTime, occupancies);

	if (isAvailable == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Timeslot not available" };
	}

	//set up occupancy object for saving
	var occupancy = new Occupancy();
	occupancy.startTime = startTime;
	occupancy.endTime = endTime;
	occupancy.assetId = input.assetId;

	//set bookingId and bookingType if available
	//bookingType is mandatory if bookingId is provided
	if (input.bookingId != null) {
		if (input.bookingType == null) {
			throw { name: customError.BAD_REQUEST_ERROR, message: "bookingType is mandatory" };
		}

		occupancy.bookingId = input.bookingId;
		occupancy.bookingType = input.bookingType;
	}

	try {
		occupancy = await occupancy.save();
	} catch (err) {
		logger.error("occupancy.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return occupancyToOutputObj(occupancy);
}

async function updateBookingId(input) {
	//validate input data
	const schema = Joi.object({
		occupancyId: Joi
			.string()
			.min(1)
			.required(),
		bookingId: Joi
			.string()
			.min(1)
			.required(),
		bookingType: Joi
			.string()
			.valid("CUSTOMER_BOOKING", "OWNER_BOOKING", "MAINTAINANCE")
	});
	
	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') }
	}
	
	//validate occupancyId
	if (mongoose.Types.ObjectId.isValid(input.occupancyId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid occupancyId" };
	}

	//validate bookingId
	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid bookingId" };
	}
	
	let occupancy;
	try {
		occupancy = await Occupancy.findById(input.occupancyId)
	} catch (err) {
		logger.error("Occupancy.findOne Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (occupancy == null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid occupancyId"}
	}

	//set bookingId and bookingType
	occupancy.bookingId = input.bookingId;
	occupancy.bookingType = input.bookingType;

	try {
		occupancy = await occupancy.save();
	} catch (err) {
		logger.error("occupancy.save Error, err");
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return occupancy;
}

async function getOccupancies(input) {
	//validate input data
	const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
		assetId: Joi
			.string()
			.required()
			.valid("A001", "MC_NXT20")
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}
	
	const startTime = utility.isoStrToDate(input.startTime, input.utcOffset);
	const endTime = utility.isoStrToDate(input.endTime, input.utcOffset);

	if (startTime > endTime) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "endTime cannot be earlier then startTime" };
	}

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

function occupancyToOutputObj(occupancy) {
	var outputObj = new Object();
	outputObj.id = occupancy._id;
	outputObj.startTime = moment(occupancy.startTime).toISOString();
	outputObj.endTime = moment(occupancy.endTime).toISOString();
	outputObj.assetId = occupancy.assetId;
	outputObj.bookingId = occupancy.bookingId;
	outputObj.bookingType = occupancy.bookingType;

	return outputObj;
}

module.exports = {
	occupyAsset,
	releaseOccupancy,
	getOccupancies,
	updateBookingId
}
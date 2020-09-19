"use strict";
const Joi = require("joi");
const moment = require('moment');
const mongoose = require("mongoose");

const utility = require("../common/utility");
const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const userAuthorization = require("../common/middleware/userAuthorization");
const Occupancy = require("./occupancy.model").Occupancy;
const occupancyHelper = require("./occupancy.helper");

const OCCUPANCY_ADMIN_GROUP = "OCCUPANCY_ADMIN_GROUP";
const OCCUPANCY_POWER_USER_GROUP = "OCCUPANCY_POWER_USER_GROUP";
const OCCUPANCY_USER_GROUP = "OCCUPANCY_USER_GROUP";
const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN_GROUP";
const BOOKING_USER_GROUP = "BOOKING_USER_GROUP";

/**
 * By : Ken Lai
 * Date : Aug 16, 2020
 * 
 * Delete occupancy record from DB
*/
function releaseOccupancy(input, user) {
	return new Promise((resolve, reject) => {
		const rightsGroup = [
			OCCUPANCY_ADMIN_GROUP,
			OCCUPANCY_POWER_USER_GROUP,
			BOOKING_ADMIN_GROUP
		]

		//validate user group
		if (userAuthorization(user.groups, rightsGroup) == false) {
			reject({ name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" });
		}

		//validate input data
		const schema = Joi.object({
			occupancyId: Joi
				.string()
				.min(1)
				.required()
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		//validate occupancyId
		if (mongoose.Types.ObjectId.isValid(input.occupancyId) == false) {
			reject({ name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid occupancyId" });
		}

		//delete target occupancy
		Occupancy.findByIdAndDelete(input.occupancyId)
			.then(() => {
				logger.info("Successfully deleted Occupancy", input.occupancyId);
				resolve ({ "result": "SUCCESS" });
			})
			.catch(err => {
				logger.error("Occupancy.findByIdAndDelete() error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Delete function not available" });
			});
	});
	
}

/*********************************************************
By : Ken Lai
Date : Aug 16, 2020

Create occupancy record in database
*********************************************************/
async function occupyAsset(input, user) {
	const rightsGroup = [
		OCCUPANCY_ADMIN_GROUP,
		OCCUPANCY_POWER_USER_GROUP,
		OCCUPANCY_USER_GROUP,
		BOOKING_ADMIN_GROUP,
		BOOKING_USER_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		occupancyType: Joi
			.string()
			.valid("CUSTOMER_BOOKING", "OWNER_BOOKING", "MAINTAINANCE")
			.required(),
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
	occupancy.occupancyType = input.occupancyType;
	occupancy.startTime = startTime;
	occupancy.endTime = endTime;
	occupancy.assetId = input.assetId;
	occupancy.createdBy = user.id;
	occupancy.createdTime = moment().toDate();
	occupancy.history = [
		{
			transactionTime: moment().toDate(),
			transactionDescription: "New Occupancy Record",
			userId: user.id,
			userName: user.name
		}
	]

	try {
		occupancy = await occupancy.save();
	} catch (err) {
		logger.error("occupancy.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return occupancyToOutputObj(occupancy);
}

/*******************************************************
By : Ken Lai

Get all occupancies with in startTime and endTime of
target asset
********************************************************/
async function getOccupancies(input, user) {
	const rightsGroup = [
		OCCUPANCY_ADMIN_GROUP,
		OCCUPANCY_POWER_USER_GROUP,
		OCCUPANCY_USER_GROUP,
		BOOKING_ADMIN_GROUP,
		BOOKING_USER_GROUP
	]

	//validate user group
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

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
	outputObj.occupancyType = occupancy.occupancyType;
	outputObj.startTime = occupancy.startTime;
	outputObj.endTime = occupancy.endTime;
	outputObj.assetId = occupancy.assetId;

	if (occupancy.history != null) {
		outputObj.history = [];

		occupancy.history.forEach(item => {
			var historyOutputObj = new Object();
			historyOutputObj.transactionTime = item.transactionTime;
			historyOutputObj.transactionDescription = item.transactionDescription;
			historyOutputObj.userId = item.userId;
			historyOutputObj.userName = item.userName;
			outputObj.history.push(historyOutputObj);
		});
	}

	return outputObj;
}

module.exports = {
	occupyAsset,
	releaseOccupancy,
	getOccupancies
}
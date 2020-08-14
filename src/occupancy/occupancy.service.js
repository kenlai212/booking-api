"use strict";
const Joi = require("joi");
var uuid = require('uuid');
const moment = require('moment');

const Occupancy = require("./occupancy.model").Occupancy;
const availibilityService = require("./availibility.service");
const gogowakeCommon = require("gogowake-common");
const logger = gogowakeCommon.logger;

require('dotenv').config();

const availableAssetIds = ["A001", "MC_NXT20"];

const OCCUPANCY_ADMIN_GROUP = "OCCUPANCY_ADMIN_GROUP";
const OCCUPANCY_POWER_USER_GROUP = "OCCUPANCY_POWER_USER_GROUP";
const OCCUPANCY_USER_GROUP = "OCCUPANCY_USER_GROUP";
const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN_GROUP";
const BOOKING_USER_GROUP = "BOOKING_USER_GROUP";

/**
 * By : Ken Lai
 *
 * Delete occupancy record from DB
*/
async function releaseOccupancy(input, user) {
	var response = new Object;
	const rightsGroup = [
		OCCUPANCY_ADMIN_GROUP,
		OCCUPANCY_POWER_USER_GROUP,
		BOOKING_ADMIN_GROUP
	]

	//validate user
	if (gogowakeCommon.userAuthorization(user.groups, rightsGroup) == false) {
		response.status = 401;
		response.message = "Insufficient Rights";
		throw response;
	}

	//Validate occupancyId
	if (input.occupancyId == null || input.occupancyId.length < 1) {
		response.status = 400;
		response.message = "occupancyId is mandatory";
		throw response;
	}

	//delete target occupancy
	await Occupancy.findByIdAndDelete(input.occupancyId)
	.then(() => {
		logger.info("Successfully deleted Occupancy.id : " + input.occupancyId);
	})
	.catch(err => {
		logger.error("occupancyModel.deleteOccupancy() error : " + err);
		response.status = 500;
		response.message = "Delete function not available";
		throw response;
	});

	return {"result":"SUCCESS"};
}

/*********************************************************
By : Ken Lai

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
	if (gogowakeCommon.userAuthorization(user.groups, rightsGroup) == false) {
		throw { status: 401, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		occupancyType: Joi
			.string()
			.valid("CUSTOMER_BOOKING", "OWNER_BOOKING", "MAINTAINANCE")
			.required(),
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		assetId: Joi
			.string()
			.required()
			.valid("A001", "MC_NXT20")
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { status: 400, message: result.error.details[0].message.replace(/\"/g, '') };
	}
	
	const startTime = moment(input.startTime);
	const endTime = moment(input.endTime);
	
	//startTime cannot be later then endTime
	if (startTime > endTime) {
		throw { status: 400, message: "endTime cannot be earlier then startTime" };
	}

	await availibilityService.checkAvailibility(startTime, endTime, assetId)
		.then(result => {
			if (result == false) {
				throw { status: 400, message: "Timeslot not available" };
			}
		})
		.catch(err => {
			const referenceId = uuid.v4();
			logger.error("Ref: " + referenceId + "; occupancy.save() error : " + err);
			throw { status: 500, message: "Internal Service error. Reference ID : " + referenceId };
		});

	//set up occupancy object for saving
	var occupancy = new Occupancy();
	occupancy.occupancyType = input.occupancyType;
	occupancy.startTime = startTime;
	occupancy.endTime = endTime;
	occupancy.assetId = input.assetId;
	occupancy.createdBy = user.id;
	occupancy.createdTime = gogowakeCommon.getNowUTCTimeStamp();
	occupancy.history = [
		{
			transactionTime: gogowakeCommon.getNowUTCTimeStamp(),
			transactionDescription: "New Occupancy Record",
			userId: user.id,
			userName: user.name
		}
	]

	//save to db
	await occupancy.save()
		.then(result => {
			occupancy = result;
		})
		.catch(err => {
			const referenceId = uuid.v4();
			logger.error("Ref: " + referenceId + "; occupancy.save() error : " + err);
			throw { status: 500, message: "Internal Service error. Reference ID : " + referenceId };
		});
	
	//set output object
	var outputObj = occupancyToOutputObj(occupancy);
	
	return outputObj;

}

/*******************************************************
By : Ken Lai

Get all occupancies with in startTime and endTime of
target asset
********************************************************/
async function getOccupancies(input, user) {
	
	var response = new Object();
	const rightsGroup = [
		OCCUPANCY_ADMIN_GROUP,
		OCCUPANCY_POWER_USER_GROUP,
		OCCUPANCY_USER_GROUP,
		BOOKING_ADMIN_GROUP,
		BOOKING_USER_GROUP
	]

	//validate user group
	if (gogowakeCommon.userAuthorization(user.groups, rightsGroup) == false) {
		response.status = 401;
		response.message = "Insufficient Rights";
		throw response;
	}

	//validate startTime
	if (input.startTime == null || input.startTime.length < 1) {
		response.status = 400;
		response.message = "startTime is mandatory";
		throw response;
	}

	var startTime;
	try {
		startTime = gogowakeCommon.standardStringToDate(input.startTime);
	} catch (err) {
		response.status = 400;
		response.message = "Invalid startTime format";
		throw response;
	}

	//validate endTime
	if (input.endTime == null || input.endTime.length < 1) {
		response.status = 400;
		response.message = "endTime is mandatory";
		throw response;
	}

	var endTime;
	try {
		endTime = gogowakeCommon.standardStringToDate(input.endTime);
	} catch (err) {
		response.status = 400;
		response.message = "Invalid endTime format";
		throw response;
	}

	if (startTime > endTime){
		response.status = 400;
		response.message = "Invalid endTime";
		throw response;
	}

	//validate asset id
	if (input.assetId == null || input.assetId.length < 1){
		response.status = 400;
		response.message = "assetId is mandatory";
		throw response;
	}

	if (availableAssetIds.includes(input.assetId) == false) {
		response.status = 400;
		response.message = "Invalid assetId";
		throw response;
	}
	
	var occupancies;
	await Occupancy.find({
		startTime: { $gte: startTime },
		endTime: { $lt: endTime },
		assetId: input.assetId
	})
		.then(result => {
			occupancies = result;
		})
		.catch(err => {
			response.status = 500;
			response.message = err.message;
			throw response;
		});

	//set outputObjs
	var outputObjs = [];
	occupancies.forEach((item) => {
		outputObjs.push(occupancyToOutputObj(item));
	});

	return { "occupancies" : outputObjs };
}

function occupancyToOutputObj(occupancy) {
	var outputObj = new Object();
	outputObj.id = occupancy._id;
	outputObj.occupancyType = occupancy.occupancyType;
	outputObj.startTime = gogowakeCommon.dateToStandardString(occupancy.startTime);
	outputObj.endTime = gogowakeCommon.dateToStandardString(occupancy.endTime);
	outputObj.assetId = occupancy.assetId;

	if (occupancy.history != null) {
		outputObj.history = [];

		occupancy.history.forEach(item => {
			var historyOutputObj = new Object();
			historyOutputObj.transactionTime = gogowakeCommon.dateToStandardString(item.transactionTime);
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
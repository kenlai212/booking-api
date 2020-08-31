"use strict";
const Joi = require("joi");
const moment = require('moment');
const mongoose = require("mongoose");
const logger = require("../common/logger").logger;

const Occupancy = require("./occupancy.model").Occupancy;
const checkAvailibility = require("./checkAvailibility.helper");
const gogowakeCommon = require("gogowake-common");
const customError = require("../errors/customError");

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
		if (gogowakeCommon.userAuthorization(user.groups, rightsGroup) == false) {
			reject({ name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" });
		}

		//validate input data
		const schema = Joi.object({
			occupancyId: Joi
				.string()
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
function occupyAsset(input, user) {
	return new Promise((resolve, reject) => {
		const rightsGroup = [
			OCCUPANCY_ADMIN_GROUP,
			OCCUPANCY_POWER_USER_GROUP,
			OCCUPANCY_USER_GROUP,
			BOOKING_ADMIN_GROUP,
			BOOKING_USER_GROUP
		]
		
		//validate user
		if (gogowakeCommon.userAuthorization(user.groups, rightsGroup) == false) {
			reject({ name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" });
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
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}
		
		const startTime = moment(input.startTime).toDate();
		const endTime = moment(input.endTime).toDate();

		//startTime cannot be later then endTime
		if (startTime > endTime) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: "endTime cannot be earlier then startTime" });
		}

		//find all occupancies with in search start and end time
		//expand search range to -1 day from startTime and +1 from endTime 
		const searchTimeRangeStart = moment(startTime).subtract(1, 'days');
		const searchTimeRangeEnd = moment(endTime).add(1, 'days');
		Occupancy.find(
			{
				startTime: { $gte: searchTimeRangeStart },
				endTime: { $lt: searchTimeRangeEnd },
				assetId: input.assetId
			})
			.then(occupancies => {
				//check availibility, if false, reject
				const isAvailable = checkAvailibility(startTime, endTime, occupancies);

				if (isAvailable == false) {
					reject({ name: customError.BAD_REQUEST_ERROR, message: "Timeslot not available" });
				}

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
				return occupancy.save();
			})
			.then(occupancy => {
				//set output object
				var outputObj = occupancyToOutputObj(occupancy);

				resolve(outputObj);
			})
			.catch(err => {
				logger.error("Internal Server Error", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});	
	});
	
}

/*******************************************************
By : Ken Lai

Get all occupancies with in startTime and endTime of
target asset
********************************************************/
function getOccupancies(input, user) {
	return new Promise((resolve, reject) => {
		const rightsGroup = [
			OCCUPANCY_ADMIN_GROUP,
			OCCUPANCY_POWER_USER_GROUP,
			OCCUPANCY_USER_GROUP,
			BOOKING_ADMIN_GROUP,
			BOOKING_USER_GROUP
		]

		//validate user group
		if (gogowakeCommon.userAuthorization(user.groups, rightsGroup) == false) {
			reject({ name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights"});
		}

		//validate input data
		const schema = Joi.object({
			startTime: Joi.date().iso().required(),
			endTime: Joi.date().iso().required(),
			assetId: Joi
				.string()
				.required()
				.valid("A001", "MC_NXT20")
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		const startTime = moment(input.startTime).toDate();
		const endTime = moment(input.endTime).toDate();

		if (startTime > endTime) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: "endTime cannot be earlier then startTime" });
		}

		Occupancy.find({
			startTime: { $gte: startTime },
			endTime: { $lt: endTime },
			assetId: input.assetId
		})
			.then(occupancies => {

				//set outputObjs
				var outputObjs = [];
				occupancies.forEach((item) => {
					outputObjs.push(occupancyToOutputObj(item));
				});

				resolve({ "occupancies": outputObjs });
			})
			.catch(err => {
				logger.error("Internal Server Error", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
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
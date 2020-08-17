"use strict";
const Joi = require("joi");
const moment = require('moment');
const mongoose = require("mongoose");

const Occupancy = require("./occupancy.model").Occupancy;
const availibilityService = require("./availibility.service");
const gogowakeCommon = require("gogowake-common");
const logger = gogowakeCommon.logger;

require('dotenv').config();

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
			reject({ status: 401, message: "Insufficient Rights" });
		}

		//validate input data
		const schema = Joi.object({
			occupancyId: Joi
				.string()
				.required()
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ status: 400, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		if (mongoose.Types.ObjectId.isValid(input.occupancyId) == false) {
			throw { status: 404, message: "Invalid occupancyId"};
		}

		//delete target occupancy
		Occupancy.findByIdAndDelete(input.occupancyId)
			.then(() => {
				logger.info("Successfully deleted Occupancy.id : " + input.occupancyId);
				resolve ({ "result": "SUCCESS" });
			})
			.catch(err => {
				logger.error("Occupancy.findByIdAndDelete() error : " + err);
				reject({ status: 500, message: "Delete function not available" });
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
			reject({ status: 401, message: "Insufficient Rights" });
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
			reject({ status: 400, message: result.error.details[0].message.replace(/\"/g, '') });
		}
		
		const startTime = moment(input.startTime).toDate();
		const endTime = moment(input.endTime).toDate();

		//startTime cannot be later then endTime
		if (startTime > endTime) {
			reject({ status: 400, message: "endTime cannot be earlier then startTime" });
		}

		//check availibility
		//console.log("startTime : " + startTime + ", endTime : " + endTime + ", assetId : " + input.assetId);
		availibilityService.checkAvailibility(startTime, endTime, input.assetId)
			.then(isAvailable => {
				if (isAvailable == false) {
					reject({ status: 400, message: "Timeslot not available" });
				}

				return;
			})
			.then(() => {

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
				reject({ status: 500, message: err.message });
			});
	});
	
}

/*******************************************************
By : Ken Lai

Get all occupancies with in startTime and endTime of
target asset
********************************************************/
async function getOccupancies(input, user) {
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
			reject({ status: 401, message: "Insufficient Rights"});
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
			reject({ status: 400, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		const startTime = moment(input.startTime).toDate();
		const endTime = moment(input.endTime).toDate();

		if (startTime > endTime) {
			reject({ status: 400, message: "endTime cannot be earlier then startTime" });
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
				reject({ status: 500, message: err.message });
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
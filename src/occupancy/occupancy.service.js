"use strict";
const Occupancy = require("./occupancy.model").Occupancy;
const common = require("gogowake-common");
const logger = common.logger;

require('dotenv').config();

const availableAssetIds = ["A001", "MC_NXT20"];
const availableOccupancyType = ["OPEN_BOOKING", "PRIVATE_BOOKING", "MAINTAINANCE"];

const OCCUPANCY_ADMIN_GROUP = "OCCUPANCY_ADMIN_GROUP";
const OCCUPANCY_POWER_USER_GROUP = "OCCUPANCY_POWER_USER_GROUP";
const OCCUPANCY_USER_GROUP = "OCCUPANCY_USER_GROUP";

/**
 * By : Ken Lai
 *
 * Delete occupancy record from DB
*/
async function releaseOccupancy(input, user) {
	var response = new Object;
	const rightsGroup = [
		OCCUPANCY_ADMIN_GROUP,
		OCCUPANCY_POWER_USER_GROUP
	]

	//validate user
	if (common.userAuthorization(user.groups, rightsGroup) == false) {
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

/**
By : Ken Lai

Returns true or false. 
Checks availability of target asset between startTime and endTime 
on target assetId
*/
async function checkAvailability(input, user) {
	var response = new Object();
	const rightsGroup = [
		OCCUPANCY_ADMIN_GROUP,
		OCCUPANCY_POWER_USER_GROUP,
		OCCUPANCY_USER_GROUP
	]

	//validate user
	if (common.userAuthorization(user.groups, rightsGroup) == false) {
		response.status = 401;
		response.message = "Insufficent Rights";
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
		startTime = common.standardStringToDate(input.startTime);
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
		endTime = common.standardStringToDate(input.endTime);
	} catch (err) {
		response.status = 400;
		response.message = "Invalid endTime format";
		throw response;
	}

	//start time cannot by later than endTime
	if (startTime > endTime){
		response.status = 400;
		response.message = "Invalid endTime";
		throw response;
	}

	//validate asset id
	if (input.assetId == null) {
		response.status = 400;
		response.message = "assetId is mandatory";
		throw response;
	}

	if (availableAssetIds.includes(input.assetId) == false) {
		response.status = 400;
		response.message = "invalid asset Id";
		throw response;
	}

	var isAvailable;
	await testTimeRangeOvelapExistingOccupancies(startTime, endTime, input.assetId)
	.then(result => {
		isAvailable = result;
	})
	.catch(err => {
		logger.error("testTimeRangeOvelapExistingOccupancies() error : " + err);
		response.status = 500;
		response.message = "Check Availability Service not available";
		throw response;
	});

	return { "isAvailable" : isAvailable };
}

/**
By : Ken Lai

Private function to return true or false.
Check to see if startTime and endTime will overlap with any
existing occupancies
*/
async function testTimeRangeOvelapExistingOccupancies(startTime, endTime, assetId){
	//set search start time to be begining of startTime day
	var searchTimeRangeStart = new Date(startTime);
	searchTimeRangeStart.setUTCHours(0);
	searchTimeRangeStart.setUTCMinutes(0);
	searchTimeRangeStart.setUTCSeconds(0);

	//set search end time to be end of endTime day
	var searchTimeRangeEnd = new Date(endTime);
	searchTimeRangeEnd.setUTCHours(23);
	searchTimeRangeEnd.setUTCMinutes(59);
	searchTimeRangeEnd.setUTCSeconds(59);

	var isAvailable = true;
	
	//fetch occupancies with in search start and end time
	await Occupancy.find({
		startTime: { $gte: searchTimeRangeStart },
		endTime: { $lt: searchTimeRangeEnd },
		assetId: assetId
	})
	.then(occupancies => {
		occupancies.forEach((item) => {
			if((startTime >= item.startTime && startTime <= item.endTime) ||
				(endTime >= item.startTime && endTime <= item.endTime) ||
				(startTime <= item.startTime && endTime >= item.endTime)){
				isAvailable = false;
			}
		});	
	})
	.catch(err => {
		logger.error("Occupancy.find() error : " + err);
		throw err;
	});

	return isAvailable;
}

/*********************************************************
By : Ken Lai

Create occupancy record in database
*********************************************************/
async function occupyAsset(input, user) {

	var response = new Object();
	const rightsGroup = [
		OCCUPANCY_ADMIN_GROUP,
		OCCUPANCY_POWER_USER_GROUP,
		OCCUPANCY_USER_GROUP
	]

	//validate user
	if (common.userAuthorization(user.groups, rightsGroup) == false) {
		response.status = 401;
		response.message = "Insufficent Rights";
		throw response;
	}

	var occupancy = new Occupancy();

	//validate and set occupancy type
	if (input.occupancyType == null) {
		response.status = 400;
		response.message = "occupancyType is mandatory";
		throw response;
	}

	if (availableOccupancyType.includes(input.occupancyType) == false) {
		response.status = 400;
		response.message = "Invalid occupancyType";
		throw response;
	}
	occupancy.occupancyType = input.occupancyType;

	//validate startTime
	if (input.startTime == null || input.startTime.length < 1) {
		response.status = 400;
		response.message = "startTime is mandatory";
		throw response;
	}

	var startTime;
	try {
		startTime = common.standardStringToDate(input.startTime);
	} catch (err) {
		response.status = 400;
		response.message = "Invalid startTime";
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
		endTime = common.standardStringToDate(input.endTime);
	} catch (err) {
		response.status = 400;
		response.message = "Invalid endTime";
		throw response;
	}
	
	//startTime cannot be later then endTime
	if (startTime > endTime){
		response.status = 400;
		response.message = "endTime cannot be earlier then startTime";
		throw response;
	}

	//validate minimum occupancy time
	var diffMs = (endTime - startTime);
	var minMs = process.env.MINIMUM_OCCUPY_TIME;
	if (diffMs < minMs) {

		var minutes = Math.floor(minMs / 60000);
		var seconds = ((minMs % 60000) / 1000).toFixed(0);

		response.status = 400;
		response.message = "Cannot occupy asset for less then " + minutes + " mins " + seconds + " secs";
		throw response;
	}

	occupancy.startTime = startTime;
	occupancy.endTime = endTime;

	//validate asset id
	if(input.assetId == null){
		response.status = 400;
		response.message = "assetId is mandatory";
		throw response;
	}

	if (availableAssetIds.includes(input.assetId) == false) {
		response.status = 400;
		response.message = "Invalid assetId";
		throw response;
	}
	occupancy.assetId = input.assetId;

	//check availability
	var isAvailable;
	try{
		isAvailable = await testTimeRangeOvelapExistingOccupancies(occupancy.startTime, occupancy.endTime, occupancy.assetId);
	}catch(err){
		logger.error("testTimeRangeOvelapExistingOccupancies() error : " + err)
		response.status = 500;
		response.message = "testTimeRangeOvelapExistingOccupancies() not available";
		throw response;
	}

	if(isAvailable == false){
		response.status = 400;
		response.message = "Timeslot not available";
		throw response;	
	}

	occupancy.createdBy = user.id;
	occupancy.createdTime = common.getNowUTCTimeStamp();
	occupancy.history = [
		{
			transactionTime: common.getNowUTCTimeStamp(),
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
			logger.error("occupancyModel.addNewOccupancy() error : " + err);
			response.status = 500;
			response.message = "occupancyModel.addNewOccupancy() not available";
			throw response;
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
		OCCUPANCY_USER_GROUP
	]

	//validate user group
	if (common.userAuthorization(user.groups, rightsGroup) == false) {
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
		startTime = common.standardStringToDate(input.startTime);
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
		endTime = common.standardStringToDate(input.endTime);
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
	outputObj.startTime = common.dateToStandardString(occupancy.startTime);
	outputObj.endTime = common.dateToStandardString(occupancy.endTime);
	outputObj.assetId = occupancy.assetId;

	if (occupancy.history != null) {
		outputObj.history = [];

		occupancy.history.forEach(item => {
			var historyOutputObj = new Object();
			historyOutputObj.transactionTime = common.dateToStandardString(item.transactionTime);
			historyOutputObj.transactionDescription = item.transactionDescription;
			historyOutputObj.userId = item.userId;
			historyOutputObj.userName = item.userName;
			outputObj.history.push(historyOutputObj);
		});
	}

	return outputObj;
}

module.exports = {
	checkAvailability,
	occupyAsset,
	releaseOccupancy,
	getOccupancies
}
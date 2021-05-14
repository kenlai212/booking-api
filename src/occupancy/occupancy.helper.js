"use strict";
const moment = require("moment");

const utility = require("../common/utility");
const {customError} = utility;

const occupancyDomain = require("./occupancy.domain");

async function checkAvailability(startTime, endTime, assetId) {
	//find all occupancies with in search start and end time
	//expand search range to -1 day from startTime and +1 from endTime 
	const searchTimeRangeStart = moment(startTime).subtract(1, 'days');
	const searchTimeRangeEnd = moment(endTime).add(1, 'days');

	const occupancies = await occupancyDomain.readOccupancies(searchTimeRangeStart, searchTimeRangeEnd, assetId);

 	//check if the time between startTime and endTime will
 	//overlap any entries in occupancies array.
 	//Returns ture or false
	var isAvailable = true;
	
	occupancies.forEach((item) => {
		if ((startTime >= item.startTime && startTime <= item.endTime) ||
			(endTime >= item.startTime && endTime <= item.endTime) ||
			(startTime <= item.startTime && endTime >= item.endTime)) {
			isAvailable = false;
		}
	});
	
	return isAvailable;
}

function validateOccupancyTime(startTime, endTime){
    if (startTime > endTime)
		throw { name: customError.BAD_REQUEST_ERROR, message: "endTime cannot be earlier then startTime" };

	if (startTime < moment().toDate() || endTime < moment().toDate())
		throw{ name: customError.BAD_REQUEST_ERROR, message: "Occupancy cannot be in the past" };
}

function validateAssetId(assetId){
	const validAssetIds = [ "A001", "MC_NXT20" ];

	if(!validAssetIds.includes(assetId))
	throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid assetId" };
}

function validateReferenceType(bookingType){
	const validReferenceTypes = [
		"BOOKING",
		"MAINTAINANCE"
	]

	if(!validReferenceTypes.includes(bookingType))
	throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid referenceType" };
}

function occupancyToOutputObj(occupancy){
	let outputObj = new Object();
	outputObj.occupancyId = occupancy._id.toString();
	outputObj.startTime = occupancy.startTime;
	outputObj.endTime = occupancy.endTime;
	outputObj.assetId = occupancy.assetId;
	outputObj.referenceType = occupancy.referenceType;
	
	if(occupancy.referenceId)
	outputObj.referenceId = occupancy.referenceId;

	outputObj.status = occupancy.status;

	return outputObj;
}

module.exports = {
	checkAvailability,
	validateOccupancyTime,
	validateAssetId,
	validateReferenceType,
	occupancyToOutputObj
}
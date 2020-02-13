"use strict";
const uuid = require("uuid");
const logger = require("./logger");
const helper = require("./helper");
const occupancyModel = require("./occupancy.model");
const {MissingMandateError, DBError} = require("./error");

const ASSET_ID = "A001";

function releaseOccupancy(bookingId){
	return new Promise((resolve, reject) => {
		if(bookingId == null){
			reject({
				status : 400,
				message : "bookingId is mandatory"
			});
		}

		resolve();
	})
	.then(async () => {

		const targetOccupancy = await occupancyModel.findOccupancyByBookingId(bookingId);

		if(targetOccupancy == null){
			reject({
				status : 400,
				message : "Invalid bookingId"
			});
		}

		return targetOccupancy;
	})
	.then(targetOccupancy => {
		occupancyModel.deleteOccupancy(targetOccupancy._id);
	})
	.catch(err => {
		if(err.status!=null){
			logger.warn(err.message);
			throw err
		}else{
			logger.error("Error while running occupancy.service.releaseOccupancy() : ", err);
			throw{
				message: "Booking service not available",
				status: 500
			}
		}
	});
}

function checkAvailability(input){
	return new Promise((resolve, reject) => {
		
		if(input.startTime == null){
			reject({
				status : 400,
				message : "startTime is mandatory"
			});
		}

		if(input.endTime == null){
			reject({
				status : 400,
				message : "endTime is mandatory"
			});
		}

		const startTime = new Date(input.startTime);
		const endTime = new Date(input.endTime);

		if(startTime > endTime){
			reject({
				status : 400,
				message : "Invalid endTime"
			});
		}

		resolve();
	})
	.then(async () => {

		//search all occupancies 2 hrs befor and after target startTime and endTime
		const searchTimeRangeStart = helper.expandStartSearchRange(new Date(input.startTime));
		const searchTimeRangeEnd = helper.expandEndSearchRange(new Date(input.endTime));

		const occupancies = await occupancyModel.searchOccupancyByTime(searchTimeRangeStart, searchTimeRangeEnd, ASSET_ID);

		const startTime = new Date(input.startTime);
		const endTime = new Date(input.endTime);
		var isAvailable = true;
		occupancies.forEach((item, index) => {
			//console.log(item);
			//console.log("startTime : ", startTime);
			//console.log("endTime : ", endTime);
			//console.log("item"+index+".startTime : ", item.startTime);
			//console.log("item"+index+".endTime : ", item.endTime);
			
			if((startTime >= item.startTime && startTime <= item.endTime) ||
				(endTime >= item.startTime && endTime <= item.endTime) ||
				(startTime <= item.startTime && endTime >= item.endTime)){
				isAvailable = false;
			}
		});
		
		return isAvailable;
	});
}

/*********************************************************
By : Ken Lai

Create occupancy record in database
*********************************************************/
function occupyAsset(input){
	return new Promise((resolve, reject) => {

		if(input.bookingId == null){
			reject({
				status : 400,
				message : "bookingId is mandatory"
			});
		}

		if(input.startTime == null){
			reject({
				status : 400,
				message : "startTime is mandatory"
			});
		}

		if(input.endTime == null){
			reject({
				status : 400,
				message : "endTime is mandatory"
			});
		}

		const startTime = helper.standardStringToDate(input.startTime);
		const endTime = helper.standardStringToDate(input.endTime);

		if(startTime > endTime){
			reject({
				status : 400,
				message : "Invalid endTime"
			});
		}

		//init new occupancy object
		var occupancy = new Object();
		occupancy.bookingId = input.bookingId;
		occupancy.startTime = startTime;
		occupancy.endTime = endTime;
		occupancy.assedId = ASSET_ID;

		resolve(occupancy);
	})
	.then(occupancy => {
		return occupancyModel.addNewOccupancy(occupancy);
	})
	.catch(err => {
		if(err.status!=null){
			logger.warn(err.message);
			throw err
		}else{
			logger.error("Error while running occupancy.service.addNewOccupancy() : ", err);
			throw{
				message: "Occupancy service not available",
				status: 500
			}
		}	
	});
}

function getOccupancies(input){
	return new Promise((resolve, reject) => {

		if(input.startTime == null){
			reject({
				status : 400,
				message : "startTime is mandatory"
			});
		}

		if(input.endTime == null){
			reject({
				status : 400,
				message : "endTime is mandatory"
			});
		}

		const startTime = new Date(input.startTime);
		const endTime = new Date(input.endTime);

		if(startTime > endTime){
			reject({
				status : 400,
				message : "Invalid endTime"
			});
		}

		resolve();
	})
	.then(async () => {
		const searchTimeRangeStart = new Date(input.startTime);
		const searchTimeRangeEnd = new Date(input.endTime);

		const occupancies = await occupancyModel.searchOccupancyByTime(searchTimeRangeStart, searchTimeRangeEnd, ASSET_ID);

		return occupancies;
	})
	.catch(err => {
		if(err.status!=null){
			logger.warn(err.message);
			throw err
		}else{
			logger.error("Error while running occupancy.service.getOccupancies() : ", err);
			throw{
				message: "Occupancy service not available",
				status: 500
			}
		}	
	});
}

module.exports = {
	checkAvailability,
	occupyAsset,
	releaseOccupancy,
	getOccupancies
}
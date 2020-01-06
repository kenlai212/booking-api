"use strict";
const uuid = require("uuid");
const logger = require("./logger");
const helper = require("./helper");
const occupancyModel = require("./occupancy.model");

const ASSET_ID = "A001";

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
		//convert input string to time
		const startTime = new Date(input.startTime);
		const endTime = new Date(input.endTime);
		console.log("startTime : ", startTime);
		console.log("endTime : ", endTime);

		//expand range by 2 hour
		const searchTimeRangeStart = startTime;
		const searchTimeRangeEnd = endTime;
		searchTimeRangeStart.setTime(startTime.getTime() - (2*60*60*1000));
		searchTimeRangeEnd.setTime(endTime.getTime() + (2*60*60*1000));

		const occupancies = await occupancyModel.searchOccupancyByTime(searchTimeRangeStart, searchTimeRangeEnd, ASSET_ID);

		occupancies.forEach((item, index) => {
			//console.log(item);
			console.log("item"+index+".startTime : ", item.startTime);
			console.log("item"+index+".endTime : ", item.endTime);
			
			if((startTime <= item.startTime && startTime >= item.endTime) 
				|| (endTime >= item.startTime && endTime <= item.endTime)
				|| (startTime <= item.startTime && endTime >= item.endTime)){
				console.log("hit time slot number " + index);
			}
		});
		
		
	});
}

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

		const startTime = new Date(input.startTime);
		const endTime = new Date(input.endTime);

		if(startTime > endTime){
			reject({
				status : 400,
				message : "Invalid endTime"
			});
		}
	})
	.then(() => {

		//set values
		var occupancy = new Object();
		occupancy.bookingId = input.bookingId;
		
		occupancy.startTime = new Date(input.startTime);
		occupancy.endTime = new Date(input.endTime);
		occupancy.timezoneOffset = occupancy.startTime.getTimezoneOffset();
		occupancy.assetId = ASSET_ID;

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

module.exports = {
	checkAvailability,
	occupyAsset
}
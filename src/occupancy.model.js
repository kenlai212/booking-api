"use strict";
const db = require("./db");
const ObjectId = require("mongodb").ObjectID;
const logger = require("./logger");

const OCCUPANCY_COLLECTION = "occupancies";
const {MissingMandateError, DBError} = require("./error");

function deleteOccupancy(occupancyId){

	if(occupancyId == null){
		throw(new MissingMandateError("occupancyId"));
	}

	try{
		db.deleteOne(OCCUPANCY_COLLECTION, {"_id":ObjectId(occupancyId)});	
	}catch(err){
		throw(err);
	}
	
}

function findOccupancyByBookingId(bookingId){
	return new Promise(async (resolve, reject) => {
		if(bookingId == null){
			reject(new MissingMandateError("startTime"));
		}

		try{
			resolve(await db.findOne(OCCUPANCY_COLLECTION, {bookingId:bookingId}));
		}catch(err){
			logger.error(err);
			reject(err);
		}
	});	
}

function searchOccupancyByTime(startTime, endTime, assetId){
	return new Promise(async (resolve, reject) => {
		if(startTime == null){
			reject(new MissingMandateError("startTime"));
		}

		if(endTime == null){
			reject(new MissingMandateError("endTime"));
		}

		if(assetId == null){
			reject(new MissingMandateError("assetId"));
		}

		try{
			const result = await db.search(OCCUPANCY_COLLECTION,
				{
					startTime : {$gte: startTime},
					endTime : {$lt : endTime},
					assetId : assetId
				});
			resolve(result);
		}catch(err){
			logger.error(err);
			reject(err);
		}
	});
}

function addNewOccupancy(occupancy){
	return new Promise(async (resolve, reject) => {

		if(occupancy.bookingId == null){
			reject(new MissingMandateError("bookingId"));	
		}

		if(occupancy.startTime == null){
			reject(new MissingMandateError("startTime"));
		}

		if(occupancy.endTime == null){
			reject(new MissingMandateError("endTime"));
		}

		if(occupancy.assetId == null){
			reject(new MissingMandateError("assetId"));
		}

		try{
			resolve(await db.insertOne(OCCUPANCY_COLLECTION, occupancy));
		}catch(err){
			reject(err);
		}
	});
}

module.exports = {
	searchOccupancyByTime,
	addNewOccupancy,
	findOccupancyByBookingId,
	deleteOccupancy
}

"use strict";
const db = require("./db");
const ObjectId = require("mongodb").ObjectID;
const logger = require("./logger");

const BOOKING_HISTORY_COLLECTION = "booking_histories";
const {MissingMandateError, DBError} = require("./error");

function addNewBookingHistory(bookingHistory){
	return new Promise(async (resolve, reject) => {

		if(bookingHistory.startTime == null){
			reject(new MissingMandateError("startTime"));
		}

		if(bookingHistory.endTime == null){
			reject(new MissingMandateError("endTime"));
		}

		if(bookingHistory.telephoneNumber == null){
			reject(new MissingMandateError("telephoneNumber"));
		}

		try{
			resolve(await db.insertOne(BOOKING_HISTORY_COLLECTION, bookingHistory));
		}catch(err){
			reject(err);
		}
	});
}

module.exports = {
	addNewBookingHistory
}
"use strict";
const db = require("./db");
const ObjectId = require("mongodb").ObjectID;
const logger = require("./logger");

const BOOKING_COLLECTION = "bookings";
const {MissingMandateError, DBError} = require("./error");

function addNewBooking(booking){
	return new Promise(async (resolve, reject) => {

		if(booking.startTime == null){
			reject(new MissingMandateError("startTime"));
		}

		if(booking.endTime == null){
			reject(new MissingMandateError("endTime"));
		}

		if(booking.telephoneNumber == null){
			reject(new MissingMandateError("telephoneNumber"));
		}

		try{
			resolve(await db.insertOne(BOOKING_COLLECTION, booking));
		}catch(err){
			reject(err);
		}
	});
}

module.exports = {
	addNewBooking
}
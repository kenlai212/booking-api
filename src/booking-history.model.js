"use strict";
const db = require("./db");
const ObjectId = require("mongodb").ObjectID;
const logger = require("./logger");

const BOOKING_HISTORY_COLLECTION = "booking_histories";
const {MissingMandateError, DBError} = require("./error");

async function addNewBookingHistory(bookingHistory){
	if(bookingHistory.startTime == null){
		throw new MissingMandateError("startTime");
	}

	if(bookingHistory.endTime == null){
		throw new MissingMandateError("endTime");
	}

	if(bookingHistory.telephoneNumber == null){
		throw new MissingMandateError("telephoneNumber");
	}

	var bookingHistory;
	await db.insertOne(BOOKING_HISTORY_COLLECTION, bookingHistory)
	.then(result => {
		bookingHistory = result;
	})
	.catch(dbErr => {
		logger.error("db.insertOne() error : " + dbErr);
		throw dbErr;
	});

	return bookingHistory;
}

module.exports = {
	addNewBookingHistory
}
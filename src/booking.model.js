"use strict";
const db = require("./db");
const ObjectId = require("mongodb").ObjectID;
const logger = require("./logger");

const BOOKING_COLLECTION = "bookings";
const {MissingMandateError, DBError} = require("./error");

async function searchBookingsByDatetime(startTime, endTime){
	if(startTime == null){
		throw new MissingMandateError("startTime");
	}

	if(endTime == null){
		throw new MissingMandateError("endTime");
	}

	var bookings = [];
	await db.search(BOOKING_COLLECTION,{
		startTime : {$gte: startTime},
		endTime : {$lt : endTime}
	})
	.then(result => {
		bookings = result;
	})
	.catch(dbErr => {
		logger.error("db.search() error : " + dbErr);
		throw dbErr;
	});

	return bookings;
}

async function addNewBooking(booking){
	if(booking.startTime == null){
		throw new MissingMandateError("startTime");
	}

	if(booking.endTime == null){
		throw new MissingMandateError("endTime");
	}

	if(booking.telephoneNumber == null){
		throw new MissingMandateError("telephoneNumber");
	}

	var newBooking;
	await db.insertOne(BOOKING_COLLECTION, booking)
	.then(result => {
		newBooking = result.ops[0];
	})
	.catch(dbErr => {
		logger.error("db.insertOne() error : " + dbErr);
		throw dbErr;
	});

	return newBooking;
}

async function deleteBooking(bookingId){
	if(bookingId == null){
		throw new MissingMandateError("bookingId");
	}

	var deleteResult;
	await db.deleteOne(BOOKING_COLLECTION, {"_id":ObjectId(bookingId)})
	.then(result => {
		deleteResult = result;
	})
	.catch(dbErr => {
		logger.error("db.deleteOne() error : " + dbErr);
		throw dbErr;
	});

	return deleteResult;
}

async function findBookingById(bookingId){
	if(bookingId == null){
		throw new MissingMandateError("bookingId");
	}

	var booking;
	await db.findOne(BOOKING_COLLECTION, {"_id":ObjectId(bookingId)})
	.then(result => {
		booking =result;
	})
	.catch(dbErr => {
		logger.error("db.findOne() error : " + dbErr);
		throw dbErr;
	});

	return booking;
}

module.exports = {
	addNewBooking,
	deleteBooking,
	findBookingById,
	searchBookingsByDatetime
}
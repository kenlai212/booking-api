"use strict";
const db = require("./db");
const ObjectId = require("mongodb").ObjectID;
const logger = require("./logger");

const BOOKING_COLLECTION = "bookings";
const {MissingMandateError, DBError} = require("./error");

function searchBookingsByDatetime(startTime, endTime){
	return new Promise(async (resolve, reject) => {
		if(startTime == null){
			reject(new MissingMandateError("startTime"));
		}

		if(endTime == null){
			reject(new MissingMandateError("endTime"));
		}

		try{
			resolve(await db.search(BOOKING_COLLECTION,
				{
					startTime : {$gte: startTime},
					endTime : {$lt : endTime}
				})
			);
		}catch(err){
			reject(err);
		}
	});
}

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

function deleteBooking(bookingId){

	if(bookingId == null){
		throw(new MissingMandateError("bookingId"));
	}

	try{
		db.deleteOne(BOOKING_COLLECTION, {"_id":ObjectId(bookingId)});	
	}catch(err){
		throw(err);
	}
	
}

function findBookingById(bookingId){
	return new Promise(async (resolve, reject) => {
		
		if(bookingId == null){
			reject(new MissingMandateError("bookingId"));
		}

		try{
			const targetBooking = await db.findOne(BOOKING_COLLECTION, {"_id":ObjectId(bookingId)});
			resolve(targetBooking);	
		}catch(err){
			reject(err);
		}
		
	});
}

module.exports = {
	addNewBooking,
	deleteBooking,
	findBookingById,
	searchBookingsByDatetime
}
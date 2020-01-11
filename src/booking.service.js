"use strict";
const uuid = require("uuid");
const logger = require("./logger");
const helper = require("./helper");
const bookingModel = require("./booking.model");
const bookingHistoryModel = require("./booking-history.model");
const occupancyService = require("./occupancy.service");

require('dotenv').config();

const CANCELLED_STATUS = "CANCELLED";
const DEFAULT_BOOKING_SEARCH_DAYS_RANGE = 7;

function addNewBooking(input){
	return new Promise(async (resolve, reject) => {
		
		//validate start time
		if(input.startTime == null){
			reject({
				status : 400,
				message : "startTime is mandatory"
			});
		}
		const startTime = new Date(input.startTime);
		const startTimeInMinutes = startTime.getMinutes() + startTime.getHours() * 60;

		//validate end time
		if(input.endTime == null){
			reject({
				status : 400,
				message : "endTime is mandatory"
			});
		}
		const endTime = new Date(input.endTime);
		const endTimeInMinutes = endTime.getMinutes() + endTime.getHours() * 60;

		if(startTimeInMinutes > endTimeInMinutes){
			reject({
				status : 400,
				message : "Invalid endTime"
			});
		}

		//check minimum booking duration
		const durationInMinutes = endTimeInMinutes - startTimeInMinutes;
		if(durationInMinutes < process.env.MINIMUM_BOOKING_DURATION_MINUTES){
			reject({
				status : 400,
				message : "booking duration cannot be less then "+ process.env.MINIMUM_BOOKING_DURATION_MINUTES +" minutes"
			});
		}

		//check maximum booking duration
		if(process.env.CHECK_FOR_MAXIMUM_BOOKING_DURATION == 1){
			if(durationInMinutes > process.env.MAXIMUM_BOOKING_DURATION_MINUTES){
				reject({
					status : 400,
					message : "booking duration cannot be more then "+ process.env.MAXIMUM_BOOKING_DURATION_MINUTES +" minutes"
				});	
			}
		}

		//validate telephone number
		if(input.telephoneNumber == null){
			reject({
				status : 400,
				message : "telephoneNumber is mandatory"
			});
		}

		resolve();
	})
	.then(async () => {
		//check if there is conflict witht the time slot
		const isAvailable = await occupancyService.checkAvailability(input);

		if(isAvailable==false){
			throw {
				status : 400,
				message : "Asset not available during this time range"
			}
		}else{
			return;
		}

	})
	.then(async () => {
		//setup and save newBooking record
		var inputBooking = new Object();
		inputBooking.creationTime = new Date();
		inputBooking.startTime = new Date(input.startTime);
		inputBooking.endTime = new Date(input.endTime);
		inputBooking.timezoneOffset = inputBooking.startTime.getTimezoneOffset();
		inputBooking.telephoneNumber = input.telephoneNumber;

		if(input.emailAddress!=null){
			inputBooking.emailAddress = input.emailAddress;
		}

		inputBooking.status = "AWAITING_PAYMENT";

		const newBooking = await bookingModel.addNewBooking(inputBooking);

		//show newBooking startTime and endTime as string
		newBooking.startTime = newBooking.startTime.toString();
		newBooking.endTime = newBooking.endTime.toString();
		return newBooking;
	})
	.then(newBooking => {
		//setup and save occupancy record
		var occupancy = new Object();
		occupancy.creationTime = new Date();
		occupancy.bookingId = newBooking._id;
		occupancy.startTime = input.startTime;
		occupancy.endTime = input.endTime;

		occupancyService.occupyAsset(occupancy);

		return newBooking;
	})
	.catch(err => {
		if(err.status!=null){
			logger.warn(err.message);
			throw err
		}else{
			logger.error("Error while running booking.service.addNewBooking() : ", err);
			throw{
				message: "Booking service not available",
				status: 500
			}
		}
	});
}

function cancelBooking(bookingId){
	return new Promise((resolve, reject) => {
		//validate bookingId
		if(bookingId==null){
			reject({
				status : 400,
				message : "bookingId is mandatory"
			});
		}

		resolve();
	})
	.then(async () =>  {

		//validate bookingId
		const targetBooking = await bookingModel.findBookingById(bookingId);

		if(targetBooking == null){
			throw {
				status : 400,
				message : "Invalid bookingId"
			};
		}

		return targetBooking;
	})
	.then(targetBooking => {
		//delete booking record from db
		bookingModel.deleteBooking(targetBooking._id);

		//add new booking history
		targetBooking.status = CANCELLED_STATUS;
		bookingHistoryModel.addNewBookingHistory(targetBooking);

		//release occupancy
		occupancyService.releaseOccupancy(targetBooking._id);

	})
	.catch(err => {
		if(err.status!=null){
			logger.warn(err.message);
			throw err
		}else{
			logger.error("Error while running booking.service.cancelBooking() : ", err);
			throw{
				message: "Booking service not available",
				status: 500
			}
		}
	});
}

function viewBookings(input){
	return new Promise(async (resolve, reject) => {
		
		//set start time
		var startTime = new Date();
		startTime.setHours(0,0,0,0);
		if(input.startTime != null){
			startTime = new Date(input.startTime);
		}

		//set end time
		var endTime = new Date(startTime);
		endTime.setHours(0,0,0,0);
		if(input.endTime !=  null){
			endTime = new Date(input.endTime);
		}else{
			endTime.setDate(endTime.getDate() + DEFAULT_BOOKING_SEARCH_DAYS_RANGE);
		}

		const bookings = await bookingModel.searchBookingsByDatetime(startTime, endTime);

		if(bookings == null){
			reject({
				status : 404,
				message : "No bookings available"
			});
		}

		resolve(bookings);
	});
}

module.exports = {
	addNewBooking,
	cancelBooking,
	viewBookings
}
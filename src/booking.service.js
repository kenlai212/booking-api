"use strict";
const uuid = require("uuid");
const logger = require("./logger");
const helper = require("./helper");
const bookingModel = require("./booking.model");
const occupancyService = require("./occupancy.service");

require('dotenv').config();

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

		if(input.telephoneNumber == null){
			reject({
				status : 400,
				message : "telephoneNumber is mandatory"
			});
		}

		resolve();
	})
	.then(async () => {
		await occupancyService.checkAvailability(input);
		//return;
	})
	.then(async () => {
		var inputBooking = new Object();
		inputBooking.startTime = new Date(input.startTime);
		inputBooking.endTime = new Date(input.endTime);
		inputBooking.timezoneOffset = inputBooking.startTime.getTimezoneOffset();
		inputBooking.telephoneNumber = input.telephoneNumber;

		if(input.emailAddress!=null){
			inputBooking.emailAddress = input.emailAddress;
		}

		inputBooking.status = "AWAITING_PAYMENT";

		const newBooking = await bookingModel.addNewBooking(inputBooking);
		return newBooking;
	})
	.then(newBooking => {
		var occupancy = new Object();
		occupancy.bookingId = newBooking._id;
		occupancy.startTime = input.startTime;
		occupancy.endTime = input.endTime;

		occupancyService.occupyAsset(occupancy);

		newBooking.startTime = newBooking.startTime.toString();
		newBooking.endTime = newBooking.endTime.toString();

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

module.exports = {
	addNewBooking
}
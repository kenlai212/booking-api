"use strict";
const fetch = require("node-fetch");
const uuid = require("uuid");
const logger = require("./logger");
const helper = require("./helper");
const bookingModel = require("./booking.model");
const bookingHistoryModel = require("./booking-history.model");

require('dotenv').config();

const CANCELLED_STATUS = "CANCELLED";
const DEFAULT_BOOKING_SEARCH_DAYS_RANGE = 7;
const MINIMUM_BOOKING_DURATION_MINUTES =  process.env.MINIMUM_BOOKING_DURATION_MINUTES;
const MAXIMUM_BOOKING_DURATION_MINUTES =  process.env.MAXIMUM_BOOKING_DURATION_MINUTES;
const OCCUPANCY_DOMAIN = process.env.OCCUPANCY_DOMAIN;
const OCCUPANCY_SUBDOMAIN = process.env.OCCUPANCY_SUBDOMAIN;
const AVAILABILITY_SUBDOMAIN = process.env.AVAILABILITY_DOMAIN;

/***********************************************************************
By : Ken Lai

Add new booking record to database, then add a corrisponding 
new occupancy record by calling occupancy service
************************************************************************/
function addNewBooking(input){
	return new Promise(async (resolve, reject) => {
		
		/******************************************
		validate and set startTime & endTime
		******************************************/
		if(input.startTime == null){
			reject({
				status : 400,
				message : "startTime is mandatory"
			});
		}
		const startTime = helper.standardStringToDate(input.startTime);

		//validate end time
		if(input.endTime == null){
			reject({
				status : 400,
				message : "endTime is mandatory"
			});
		}
		const endTime = helper.standardStringToDate(input.endTime);

		if(startTime > endTime){
			reject({
				status : 400,
				message : "Invalid endTime"
			});
		}

		//check minimum booking duration
		const startTimeInMinutes = startTime.getMinutes() + startTime.getHours() * 60;
		const endTimeInMinutes = endTime.getMinutes() + endTime.getHours() * 60;
		const durationInMinutes = endTimeInMinutes - startTimeInMinutes;
		if(durationInMinutes < MINIMUM_BOOKING_DURATION_MINUTES){
			reject({
				status : 400,
				message : "booking duration cannot be less then "+ MINIMUM_BOOKING_DURATION_MINUTES +" minutes"
			});
		}

		//check maximum booking duration
		if(process.env.CHECK_FOR_MAXIMUM_BOOKING_DURATION == 1){
			if(durationInMinutes > MAXIMUM_BOOKING_DURATION_MINUTES){
				reject({
					status : 400,
					message : "booking duration cannot be more then "+ MAXIMUM_BOOKING_DURATION_MINUTES +" minutes"
				});	
			}
		}

		var booking = new Object();
		booking.startTime = startTime;
		booking.endTime = endTime;

		resolve(booking);
	})
	.then(booking => {
		
		/********************************************
		validate and set contact infomation
		********************************************/

		//validate contact name
		if(input.contactName == null){
			throw{
				status : 400,
				message : "contactName is mandatory"
			}
		}
		booking.contactName = input.contactName;

		//validate telephone number
		if(input.telephoneNumber == null){
			throw{
				status : 400,
				message : "telephoneNumber is mandatory"
			}
		}
		booking.telephoneNumber = input.telephoneNumber;

		//validate email address
		//TODO validate email format
		if(input.emailAddress!=null){
			booking.emailAddress = input.emailAddress;
		}

		return booking;
	})
	.then(async booking => {
		/*****************************************************
		Check if there is conflict witht the time slot.
		*****************************************************/
		const url = OCCUPANCY_DOMAIN + AVAILABILITY_SUBDOMAIN;
		const headers = {
			"content-Type": "application/json",
		}
		const data = {
			"startTime": helper.dateToStandardString(booking.startTime),
			"endTime": helper.dateToStandardString(booking.endTime)
		}

		await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data)})
		.then((res) => {
			/**********************************************************************
			throw 500 error, external occupancyService/availability service not available
			***********************************************************************/
			if (res.status >= 200 && res.status < 300) {
				return res.json();
			}else{
				logger.error(res.statusText);
				throw {
					status : 500,
					message : "Booking Service not available"
				}
			}
		})
		.then((result) => {
			/*******************************
			throw 400 error if not available
			********************************/
			if(result.isAvailable==false){
				throw {
					status : 400,
					message : "Asset not available during this time range"
				}
			}
		});

		return booking;
	})
	.then(async booking => {
		/************************************************************
		setup and save newBooking record
		************************************************************/
		booking.creationTime = new Date();
		booking.status = "AWAITING_PAYMENT";

		booking = await bookingModel.addNewBooking(booking);

		return booking;
	})
	.then(booking => {
		/***************************************************************
		call external occupancy API to save occupancy record
		***************************************************************/
		const url = OCCUPANCY_DOMAIN + OCCUPANCY_SUBDOMAIN;
		const headers = {
			"content-Type": "application/json",
		}
		const data = {
			"occupancyType" : "OPEN_BOOKING",
			"associatedId" : booking._id,
			"startTime": helper.dateToStandardString(booking.startTime),
			"endTime": helper.dateToStandardString(booking.endTime)
		}

		fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data)})
		.then((res) => {
			/**********************************************************************
			-throw 500 error, external occupancyService/occupancy service not available
			-reverse the booking record
			***********************************************************************/
			if (res.status >= 200 && res.status < 300) {
				//success - do nothing!
			}else{
				//TODO - Reverse booking sisnce external occupancy service not available
				logger.error(res.statusText);
				throw {
					status : 500,
					message : "Booking Service not available"
				}
			}
		});

		return booking;
	})
	.then(booking => {
		booking.startTime = helper.dateToStandardString(booking.startTime);
		booking.endTime = helper.dateToStandardString(booking.endTime);
		return booking;
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

/************************************************************************
By : Ken Lai

delete booking from database, delete the corrisponding occupancy record
by calling occupancy service.
************************************************************************/
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

/*************************************************************
By : Ken Lai

-Returns all bookings withint a datetime range
-If no startTime or endTime from input, then its default
 to start of today and end of x date later. 
 x = DEFAULT_BOOKING_SEARCH_DAYS_RANGE
*************************************************************/
function viewBookings(input){
	return new Promise(async (resolve, reject) => {
		
		//initate startTime
		var startTime = new Date();
		startTime.setHours(0,0,0,0);

		//if input contains startTime, use it
		if(input.startTime != null){
			startTime = helper.standardStringToDate(input.startTime);
		}

		//initiage end Time
		var endTime = new Date(startTime);
		endTime.setHours(0,0,0,0);

		//if input contains endTime, use it.
		//if not use 
		if(input.endTime !=  null){
			endTime = helper.standardStringToDate(input.endTime);
		}else{
			endTime.setDate(endTime.getDate() + DEFAULT_BOOKING_SEARCH_DAYS_RANGE);
		}

		console.log(startTime);
		console.log(endTime);
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
"use strict";
const fetch = require("node-fetch");
const uuid = require("uuid");
const logger = require("./logger");
const helper = require("./helper");
const bookingModel = require("./booking.model");
const bookingHistoryModel = require("./booking-history.model");

require('dotenv').config();

const CANCELLED_STATUS = "CANCELLED";
const MINIMUM_BOOKING_DURATION_MINUTES =  process.env.MINIMUM_BOOKING_DURATION_MINUTES;
const MAXIMUM_BOOKING_DURATION_MINUTES =  process.env.MAXIMUM_BOOKING_DURATION_MINUTES;
const OCCUPANCY_DOMAIN = process.env.OCCUPANCY_DOMAIN;
const OCCUPANCY_SUBDOMAIN = process.env.OCCUPANCY_SUBDOMAIN;
const AVAILABILITY_SUBDOMAIN = process.env.AVAILABILITY_SUBDOMAIN;
const RELEASE_OCCUPANCY_SUBDOMAIN = process.env.RELEASE_OCCUPANCY_SUBDOMIAN;

/***********************************************************************
By : Ken Lai

Add new booking record to database, then add a corrisponding 
new occupancy record by calling occupancy service
************************************************************************/
async function addNewBooking(input){
	var response = new Object;
	var booking = new Object();

	/******************************************
	validate and set startTime & endTime
	******************************************/
	if(input.startTime == null){
		response.status = 400;
		response.message = "startTime is mandatory";
		throw response;
	}

	//validate end time
	if(input.endTime == null){
		response.status = 400;
		response.message = "endTime is mandatory";
		throw response;
	}

	var startTime;
	var endTime;
	try{
		startTime = helper.standardStringToDate(input.startTime);
		endTime = helper.standardStringToDate(input.endTime);
	}catch(err){
		//invalid input date string format
		response.status = 400;
		response.message = err.message;
		throw response;
	}
		
	if(startTime > endTime){
		response.status = 400;
		response.message = "Invalid endTime";
		throw response;
	}

	booking.startTime = startTime;
	booking.endTime = endTime;

	//check minimum booking duration
	const startTimeInMinutes = startTime.getMinutes() + startTime.getHours() * 60;
	const endTimeInMinutes = endTime.getMinutes() + endTime.getHours() * 60;
	const durationInMinutes = endTimeInMinutes - startTimeInMinutes;
	if(durationInMinutes < MINIMUM_BOOKING_DURATION_MINUTES){
		response.status = 400;
		response.message = "booking duration cannot be less then "+ MINIMUM_BOOKING_DURATION_MINUTES +" minutes";
		throw response;
	}

	//check maximum booking duration
	if(process.env.CHECK_FOR_MAXIMUM_BOOKING_DURATION == 1){
		if(durationInMinutes > MAXIMUM_BOOKING_DURATION_MINUTES){
			response.status = 400;
			response.message = "booking duration cannot be more then "+ MAXIMUM_BOOKING_DURATION_MINUTES +" minutes";
			throw response;
		}
	}

	//validate contact name
	if(input.contactName == null){
		response.status = 400;
		response.message = "contactName is mandatory";
		throw response;
	}
	booking.contactName = input.contactName;

	//validate telephone number
	if(input.telephoneNumber == null){
		response.status = 400;
		response.message = "telephoneNumber is mandatory";
		throw response;
	}
	booking.telephoneNumber = input.telephoneNumber;

	//validate email address
	//TODO validate email format
	if(input.emailAddress!=null){
		booking.emailAddress = input.emailAddress;
	}

	//call external occupancy API to save occupancy record
	await callOccupancyAPI(booking.startTime, booking.endTime)
	.then(newOccupancy => {
		logger.info("Saved new occupancy.id : " + newOccupancy._id);
		booking.occupancyId = newOccupancy._id;
	})
	.catch(err => {
		response.status = 500;
		response.message = err.message;
		throw response;
	});

	//setup and save newBooking record
	booking.creationTime = new Date();
	booking.status = "AWAITING_PAYMENT";
	await bookingModel.addNewBooking(booking)
	.then(newBooking => {
		logger.info("Successfully saved new booking");
		booking = newBooking;
	})
	.catch(err => {
		logger.error("bookingModel.addNewBooking() error : " + err);
		response.status = 500;
		response.message = "Add new booking function not available";
		throw response;
	});

	booking.startTime = helper.dateToStandardString(booking.startTime);
	booking.endTime = helper.dateToStandardString(booking.endTime);
	
	return booking;
}

async function callOccupancyAPI(startTime, endTime){
	const url = OCCUPANCY_DOMAIN + OCCUPANCY_SUBDOMAIN;
	const headers = {
		"content-Type": "application/json",
	}
	const data = {
		"occupancyType" : "OPEN_BOOKING",
		"startTime": helper.dateToStandardString(startTime),
		"endTime": helper.dateToStandardString(endTime)
	}

	var occupancy;
	await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data)})
	.then((res) => {
		if (res.status >= 200 && res.status < 300) {
			logger.info("Occupancy record successfuly saved via Occupancy API");
			occupancy = res.json();
		}else{
			logger.error("Extrenal Occupancy API failed : " + res.statusText);
			var response = new Object();
			response.status = res.status;
			response.message = res.statusText;
			throw response;
		}
	});
	
	return occupancy;
}

async function callAvailabilityAPI(startTime, endTime){
	const url = OCCUPANCY_DOMAIN + AVAILABILITY_SUBDOMAIN;
	const headers = {
		"content-Type": "application/json",
	}
	const data = {
		"startTime": helper.dateToStandardString(startTime),
		"endTime": helper.dateToStandardString(endTime)
	}

	var isAvailable;
	await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data)})
	.then(res => {
		if (res.status >= 200 && res.status < 300) {
			isAvailable = res.json();
		}else{
			logger.error("External Availability API failed : " + res.statusText);
			var response = new Object();
			response.status = res.status;
			response.message = res.statusText;
			throw response;
		}
	});

	return isAvailable;
}

async function callReleaseOccupancyAPI(occupancyId){
	const url = OCCUPANCY_DOMAIN + RELEASE_OCCUPANCY_SUBDOMAIN + "/" + occupancyId;
	const headers = {
		"content-Type": "application/json",
	}

	var isAvailable;
	await fetch(url, { method: 'DELETE', headers: headers})
	.then(res => {
		if (res.status >= 200 && res.status < 300) {
			isAvailable = res.json();
		}else{
			logger.error("External Release Occupancy API failed : " + res.statusText);
			var response = new Object();
			response.status = res.status;
			response.message = res.statusText;
			throw response;
		}
	});

	return isAvailable;
}

/************************************************************************
By : Ken Lai

delete booking from database, delete the corrisponding occupancy record
by calling occupancy service.
************************************************************************/
async function cancelBooking(bookingId){
	var response = new Object;

	//validate bookingId
	if(bookingId==null){
		response.status = 400;
		response.message = "bookingId is mandatory";
		throw(response);
	}

	var targetBooking;
	await bookingModel.findBookingById(bookingId)
	.then(booking => {
		targetBooking = booking;
	})
	.catch(err => {
		logger.error("bookingModel.findBookingById() error : " + err);
		response.status = 500;
		response.message = "Cancel Booking Service not available";
		throw response;
	});

	if(targetBooking == null){
		response.status = 400;
		response.message = "Invalid booking ID";
		throw response;
	}

	//release occupancy
	await callReleaseOccupancyAPI(targetBooking.occupancyId)
	.then(() => {
		logger.info("Successfully called Release Occupancy API to deleted occupancy.id " + targetBooking.occupancyId);
	})
	.catch(err => {
		response.status = 500;
		response.message = err.message;
		throw response;
	});

	//delete booking record from db
	await bookingModel.deleteBooking(booking._id)
	.then(() => {
		logger.info("Deleted booking.id : " + bookingId);
	})
	.catch(err => {
		logger.error("bookingModel.deleteBooking() error : " + err);
		response.status = 500;
		response.message = "Cancel Booking Service not available";
		throw response;
	});

	//add new booking history
	targetBooking.status = CANCELLED_STATUS;
	await bookingHistoryModel.addNewBookingHistory(targetBooking)
	.then(bookingHistory => {
		logger.info("Saved new bookingHistory.id : " + bookingHistory._id);
	})
	.catch(err => {
		logger.error("bookingHistoryModel.addNewBookingHistory() error : " + err);
		response.status = 500;
		response.message = "Cancel Booking Service not available";
		throw response;
	});

	return "SUCCESS";
}

/*************************************************************
By : Ken Lai

-Returns all bookings withint a datetime range
-If no startTime or endTime from input, then its default
 to start of today and end of x date later. 
 x = DEFAULT_BOOKING_SEARCH_DAYS_RANGE
*************************************************************/
async function viewBookings(input){
	var response = new Object;

	if(input.startTime == null){
		response.status = 400;
		response.message = "startTime is mandatory";
		throw response;	
	}

	if(input.endTime == null){
		response.status = 400;
		response.message = "endTime is mandatory";
		throw response;	
	}

	var startTime;
	var endTime;
	try{
		startTime = helper.standardStringToDate(input.startTime);
		endTime = helper.standardStringToDate(input.endTime);
	}catch(err){
		//invalid input date string format
		response.status = 400;
		response.message = err.message;
		throw response;
	}

	if(startTime > endTime){
		response.status = 400;
		response.message = "Invalid endTime";
		throw response;
	}

	var bookings = [];
	await bookingModel.searchBookingsByDatetime(startTime, endTime)
	.then(result => {
		bookings = result;
	})
	.catch(err => {
		logger.error("bookingHistoryModel.addNewBookingHistory() error : " + err);
		response.status = 500;
		response.message = "Cancel Booking Service not available";
		throw response;
	});

	return bookings;
}

module.exports = {
	addNewBooking,
	cancelBooking,
	viewBookings
}
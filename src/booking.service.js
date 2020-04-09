"use strict";
const fetch = require("node-fetch");
const uuid = require("uuid");
const logger = require("./logger");
const helper = require("./helper");
const bookingModel = require("./booking.model");
const bookingHistoryModel = require("./booking-history.model");

require('dotenv').config();

const newBookingNotificationAdminTel = ["85293139332", "85261893898"];
const CANCELLED_STATUS = "CANCELLED";

/***********************************************************************
By : Ken Lai

Add new booking record to database, then add a corrisponding 
new occupancy record by calling occupancy service
************************************************************************/
async function addNewBooking(input, user){
	var response = new Object;
	const rightsGroup = [
		"BOOKING_ADMIN_GROUP",
		"BOOKING_USER_GROUP"
	]

	//validate user group
	if (helper.userAuthorization(user.groups, rightsGroup) == false) {
		response.status = 401;
		response.message = "Insufficient Rights";
		throw response;

	}

	//validate startTime
	if(input.startTime == null || input.startTime.length < 1){
		response.status = 400;
		response.message = "startTime is mandatory";
		throw response;
	}

	//validate end time
	if(input.endTime == null || input.endTime.length < 1){
		response.status = 400;
		response.message = "endTime is mandatory";
		throw response;
	}

	var booking = new Object();

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

	//check if endTime is earlier then startTime
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
	if (durationInMinutes < process.env.MINIMUM_BOOKING_DURATION_MINUTES){
		response.status = 400;
		response.message = "booking duration cannot be less then "+ MINIMUM_BOOKING_DURATION_MINUTES +" minutes";
		throw response;
	}

	//check maximum booking duration
	if(process.env.CHECK_FOR_MAXIMUM_BOOKING_DURATION == true){
		if (durationInMinutes > process.env.MAXIMUM_BOOKING_DURATION_MINUTES){
			response.status = 400;
			response.message = "booking duration cannot be more then "+ MAXIMUM_BOOKING_DURATION_MINUTES +" minutes";
			throw response;
		}
	}

	//validate contact name
	if (input.contactName == null || input.contactName.length < 1){
		response.status = 400;
		response.message = "contactName is mandatory";
		throw response;
	}
	booking.contactName = input.contactName;

	//validate country code
	if (input.telephoneCountryCode == null || input.telephoneCountryCode.length < 1) {
		response.status = 400;
		response.message = "telephoneCountryCode is mandatory";
		throw response;
	}

	//TODO restrict only HK and China country code???

	//validate telephone number
	if(input.telephoneNumber == null){
		response.status = 400;
		response.message = "telephoneNumber is mandatory";
		throw response;
	}
	booking.telephoneNumber = input.telephoneCountryCode + input.telephoneNumber;

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
		response.status = err.status;
		response.message = err.message;
		throw response;
	});

	//setup and save newBooking record
	booking.creationTime = new Date();
	booking.status = "AWAITING_PAYMENT";
	await bookingModel.addNewBooking(booking)
	.then(newBooking => {
		logger.info("Successfully saved new booking : " + newBooking._id);
		booking = newBooking;
	})
	.catch(err => {
		logger.error("bookingModel.addNewBooking() error : " + err);
		response.status = 500;
		response.message = "Add new booking function not available";
		throw response;
	});

	//change date object to display friendly string
	booking.startTime = helper.dateToStandardString(booking.startTime);
	booking.endTime = helper.dateToStandardString(booking.endTime);

	//send notification to admin
	if (process.env.SEND_NEW_BOOKING_NOTIFICATION_SMS == true) {
		const content = "New booking request from "
			+ booking.contactName + " (" + booking.telephoneNumber + "). Time - "
			+ booking.startTime + " to " + booking.endTime;

		newBookingNotificationAdminTel.forEach(async number => {
			await callSendSMSAPI(number, content)
				.catch(err => {
					logger.error("callSendSMSAPI error : " + err);
				});
		});
	}

	//send confirmation to contact
	//TODO add chinese language confirmation
	if (process.env.SEND_NEW_BOOKING_CONFIRMATION_SMS == true) {
		const content = "Thank you for your booking (" + booking.startTime + " - " + booking.endTime + ")";

		await callSendSMSAPI(booking.telephoneNumber, content)
			.catch(err => {
				logger.error("callSendSMSAPI error : " + err);
			});
	}

	return booking;
}

async function callSendSMSAPI(telephoneNumber, content) {
	const url = process.env.NOTIFICATION_DOMAIN + process.env.SEND_SMS_SUBDOMAIN;
	const headers = {
		"Authorization": "Token " + accessToken,
		"content-Type": "application/json",
	}
	const data = {
		"message": content,
		"number": telephoneNumber,
		"subject": "test subject"
	}

	var tokenResponse = null;
	var breakFlag = false;

	for (var i = 0; i < 1; i++) {

		if (breakFlag == true) {
			break;
		}

		await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data) })
			.then(async res => {
				if (res.status >= 200 && res.status < 300) {
					logger.info("Successfully called sendSMS API");
					breakFlag = true;
				} else if (res.status == 403) {
					await helper.callTokenAPI()
						.then(response => {
							tokenResponse = response;
						})
						.catch(err => {
							response.status = 500;
							response.message = "helper.callLoginAPI() not available";
							throw response;
						});
				} else {
					logger.error("Extrenal Send SMS API failed : " + res.statusText);
					var response = new Object();
					response.status = res.status;
					response.message = res.statusText;
					throw response;
				}
			});

		if (tokenResponse != null) {
			global.accessToken = tokenResponse.accessToken;
			logger.info("Obtained accessToken : " + global.accessToken);
		}
	}
	
	return;
}

async function callOccupancyAPI(startTime, endTime){
	const url = process.env.OCCUPANCY_DOMAIN + process.env.OCCUPANCY_SUBDOMAIN;
	const headers = {
		"Authorization": "Token " + accessToken,
		"content-Type": "application/json",
	}
	const data = {
		"occupancyType" : "OPEN_BOOKING",
		"startTime": helper.dateToStandardString(startTime),
		"endTime": helper.dateToStandardString(endTime)
	}

	var occupancy;
	var tokenResponse = null;
	var breakFlag = false;

	for (var i = 0; i < 1; i++) {

		if (breakFlag == true) {
			break;
		}

		await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data) })
			.then(async res => {
				if (res.status >= 200 && res.status < 300) {
					logger.info("Occupancy record successfuly saved via Occupancy API");
					occupancy = res.json();
					breakFlag = true;
				} else if (res.status == 403) {
					await helper.callTokenAPI()
						.then(response => {
							tokenResponse = response;
						})
						.catch(err => {
							response.status = 500;
							response.message = "helper.callLoginAPI() not available";
							throw response;
						});
				} else {
					logger.error("Extrenal Occupancy API failed : " + res.statusText);
					var response = new Object();
					response.status = res.status;
					response.message = res.statusText;
					throw response;
				}
			});

		if (tokenResponse != null) {
			global.accessToken = tokenResponse.accessToken;
			logger.info("Obtained accessToken : " + global.accessToken);
		}
	}
	
	return occupancy;
}

async function callReleaseOccupancyAPI(occupancyId){
	const url = process.env.OCCUPANCY_DOMAIN + process.env.RELEASE_OCCUPANCY_SUBDOMAIN + "/" + occupancyId;
	const headers = {
		"Authorization": "Token " + accessToken,
		"content-Type": "application/json",
	}

	var tokenResponse = null;
	var breakFlag = false;

	for (var i = 0; i < 1; i++) {

		if (breakFlag == true) {
			break;
		}

		await fetch(url, { method: 'DELETE', headers: headers })
			.then(async res => {
				if (res.status >= 200 && res.status < 300) {
					logger.info("Sucessfully called Release Occupancy API on occupancyID : " + occupancyId);
				} else if (res.status == 403) {
					await helper.callTokenAPI()
						.then(response => {
							tokenResponse = response;
						})
						.catch(err => {
							response.status = 500;
							response.message = "helper.callLoginAPI() not available";
							throw response;
						});
				} else {
					logger.error("External Release Occupancy API failed : " + res.statusText);
					var response = new Object();
					response.status = res.status;
					response.message = res.statusText;
					throw response;
				}
			});

		if (tokenResponse != null) {
			global.accessToken = tokenResponse.accessToken;
			logger.info("Obtained accessToken : " + global.accessToken);
		}
	}

	return;
}

/************************************************************************
By : Ken Lai

delete booking from database, delete the corrisponding occupancy record
by calling occupancy service.
************************************************************************/
async function cancelBooking(bookingId, user){
	var response = new Object;

	const rightsGroup = [
		"BOOKING_ADMIN_GROUP",
		"BOOKING_USER_GROUP"
	]

	//validate user group
	if (helper.userAuthorization(user.groups, rightsGroup) == false) {
		response.status = 401;
		response.message = "Insufficient Rights";
		throw response;

	}

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
	await bookingModel.deleteBooking(targetBooking._id)
	.then(() => {
		logger.info("Deleted booking.id : " + targetBooking._id);
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
Date : Mar 01 2020

-Returns all bookings withint a datetime range
*************************************************************/
async function viewBookings(input, user){
	var response = new Object;
	const rightsGroup = [
		"BOOKING_ADMIN_GROUP",
		"BOOKING_USER_GROUP"
	]

	//validate user group
	if (helper.userAuthorization(user.groups, rightsGroup) == false) {
		response.status = 401;
		response.message = "Insufficient Rights";
		throw response;
	}

	//validate start and end time
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

	bookings.forEach((item, index) => {
		item.startTime = helper.dateToStandardString(item.startTime);
		item.endTime = helper.dateToStandardString(item.endTime);
	});

	return bookings;
}

module.exports = {
	addNewBooking,
	cancelBooking,
	viewBookings
}
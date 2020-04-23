"use strict";
const logger = require("./logger");
const helper = require("./helper");
const bookingModel = require("./booking.model");
const bookingHistoryModel = require("./booking-history.model");
const pricingService = require("./pricing.service");

require('dotenv').config();

const CANCELLED_STATUS = "CANCELLED";

/**
 * By : Ken Lai
 * Date : Mar 25, 2020
 * 
 * @param {any} input
 * @param {any} user
 * 
 * Add new booking record to database, then add a corrisponding
 * new occupancy record by calling occupancy service
 */
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
	const diffTime = Math.abs(endTime - startTime);
	const durationInMinutes = Math.ceil(diffTime / (1000 * 60));
	if (durationInMinutes < process.env.MINIMUM_BOOKING_DURATION_MINUTES){
		response.status = 400;
		response.message = "booking duration cannot be less then " + process.env.MINIMUM_BOOKING_DURATION_MINUTES +" minutes";
		throw response;
	}

	//check maximum booking duration
	if(process.env.CHECK_FOR_MAXIMUM_BOOKING_DURATION == true){
		if (durationInMinutes > process.env.MAXIMUM_BOOKING_DURATION_MINUTES){
			response.status = 400;
			response.message = "booking duration cannot be more then " + process.env.MAXIMUM_BOOKING_DURATION_MINUTES +" minutes";
			throw response;
		}
	}

	//calculate duration in hours
	booking.durationInHours = Math.round(durationInMinutes / 60);

	//calculate pricing & currency
	const totalAmountObj = pricingService.calculateTotalAmount(input.startTime, input.endTime, user);
	booking.totalAmount = totalAmountObj.totalAmount
	booking.currency = totalAmountObj.currency;

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

	const acceptedCountryCode = ["852", "853", "86"];
	if (acceptedCountryCode.includes(input.telephoneCountryCode) == false) {
		response.status = 400;
		response.message = "invalid telephoneCountryCode";
		throw response;
	}
	booking.telephoneCountryCode = input.telephoneCountryCode;

	//validate telephone number
	if(input.telephoneNumber == null){
		response.status = 400;
		response.message = "telephoneNumber is mandatory";
		throw response;
	}
	booking.telephoneNumber = input.telephoneNumber;

	//validate email address
	if(input.emailAddress == null){
		response.status = 400;
		response.message = "emailAddress is mandatory";
		throw response;
	}
	booking.emailAddress = input.emailAddress;

	return booking;

	//call external occupancy API to save occupancy record
	const url = process.env.OCCUPANCY_DOMAIN + process.env.OCCUPANCY_SUBDOMAIN;
	const data = {
		"occupancyType": "OPEN_BOOKING",
		"startTime": helper.dateToStandardString(booking.startTime),
		"endTime": helper.dateToStandardString(booking.endTime)
	}
	const requestAttr = {
		method: "POST",
		body: JSON.stringify(data)
	}

	await helper.callAPI(url, requestAttr)
		.then(result => {
			booking.occupancyId = result._id;
			logger.info("Successfully call occupancy api, and saved occupancy record : " + result._id);
		})
		.catch(err => {
			throw err;
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
	if (process.env.SEND_NEW_BOOKING_ADMIN_NOTIFICATION_EMAIL == true) {
		const url = process.env.NOTIFICATION_DOMAIN + "/emailsss";

		const bodyHTML = "New booking request from "
			+ booking.contactName + " (" + booking.telephoneNumber + "). Time - "
			+ booking.startTime + " to " + booking.endTime;

		const data = {
			"sender": "booking@hebewake.com",
			"recipient": "gogowakehk@gmail.com",
			"emailBody": bodyHTML
		}

		const requestAttr = {
			method: "POST",
			body: JSON.stringify(data)
		}

		await helper.callAPI(url, requestAttr)
			.then(result => {
				logger.info("Successfully sent notification email to admin, messageId : " + result.messageId);
			})
			.catch(err => {
				logger.error("Failed to send new booking notification email to admin : " + JSON.stringify(err));
			});
	}

	//send confirmation to contact
	//TODO add chinese language confirmation
	if (process.env.SEND_NEW_BOOKING_CUSTOMER_CONFIRMATION_SMS == true) {
		const url = process.env.NOTIFICATION_DOMAIN + process.env.SEND_SMS_SUBDOMAIN + "sss";
		const data = {
			"message": "Thank you for your booking (" + booking.startTime + " - " + booking.endTime + ")",
			"number": booking.telephoneNumber,
			"subject": "test subject"
		}
		const requestAttr = {
			method: "POST",
			body: JSON.stringify(data)
		}

		await helper.callAPI(url, requestAttr)
			.then(result => {
				logger.info("Sucessfully sent new booking notification SMS to customer, messageId : " + result.messageId);
			})
			.catch(err => {
				logger.error("Failed to send new booking notification SMS to customer : " + JSON.stringify(err));
			});
	}

	return booking;
}

/**
 * By : Ken Lai
 * Date : Mar 12, 2020
 * 
 * @param {any} bookingId
 * @param {any} user
 * 
 * delete booking from database, delete the corrisponding occupancy record by calling occupancy service.
 */
async function cancelBooking(bookingId, user){
	var response = new Object;

	const rightsGroup = [
		"BOOKING_ADMIN_GROUP"
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
	const url = process.env.OCCUPANCY_DOMAIN + process.env.RELEASE_OCCUPANCY_SUBDOMAIN + "/" + occupancyId;
	const requestAttr = {
		method: "DELETE",
	}

	await helper.callAPI(url, requestAttr)
		.catch(err => {
			throw err;
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

/**
 * By : Ken Lai
 * Date : Mar 01, 2020
 * 
 * @param {any} input
 * @param {any} user
 * 
 * Returns all bookings withint a datetime range
 */
async function viewBookings(input, user){
	var response = new Object;
	const rightsGroup = [
		"BOOKING_ADMIN_GROUP",
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

	var bookings;
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

async function findBookingById(id, user) {
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

	if (id.length == null || id.length < 1) {
		response.status = 403;
		response.message = "id is mandatory";
		throw response;
	}

	var booking;
	await bookingModel.findBookingById(id)
		.then(result => {
			booking = result;
		})
		.catch(err => {
			logger.error("bookingHistoryModel.findBookingById() error : " + err);
			response.status = 500;
			response.message = "Cancel Booking Service not available";
			throw response;
		});

	return booking;
}

module.exports = {
	addNewBooking,
	cancelBooking,
	viewBookings,
	findBookingById
}
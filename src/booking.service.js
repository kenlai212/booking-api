"use strict";
const logger = require("./logger");
const helper = require("./helper");
const Booking = require("./booking.model").Booking;
const BookingHistory = require("./booking-history.model").BookingHistory;

const pricingService = require("./pricing.service");

require('dotenv').config();

const DEFAULT_ASSET_ID = "MC_NXT20";

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
async function addNewBooking(input, user) {
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
	if (input.startTime == null || input.startTime.length < 1) {
		response.status = 400;
		response.message = "startTime is mandatory";
		throw response;
	}

	var startTime;
	try {
		startTime = helper.standardStringToDate(input.startTime);
	} catch (err) {
		response.status = 400;
		response.message = "Invalid startTime format";
		throw response;
	}

	//validate end time
	if (input.endTime == null || input.endTime.length < 1) {
		response.status = 400;
		response.message = "endTime is mandatory";
		throw response;
	}

	var endTime;
	try {
		endTime = helper.standardStringToDate(input.endTime);
	} catch (err) {
		response.status = 400;
		response.message = "Invalid startTime format";
		throw response;
	}

	//check if endTime is earlier then startTime
	if (startTime > endTime) {
		response.status = 400;
		response.message = "Invalid endTime";
		throw response;
	}

	//check minimum booking duration
	const diffMs = (endTime - startTime);
	const minMs = process.env.MINIMUM_BOOKING_TIME;
	if (diffMs < minMs) {

		var minutes = Math.floor(minMs / 60000);
		var seconds = ((minMs % 60000) / 1000).toFixed(0);

		response.status = 400;
		response.message = "Booking cannot be less then " + minutes + " mins " + seconds + " secs";
		throw response;
	}

	//check maximum booking duration
	const maxMs = process.env.MAXIMUM_BOOKING_TIME
	if (process.env.CHECK_FOR_MAXIMUM_BOOKING_DURATION == true) {
		if (diffMs > maxMs) {

			var minutes = Math.floor(maxMs / 60000);
			var seconds = ((maxMs % 60000) / 1000).toFixed(0);

			response.status = 400;
			response.message = "Booking cannot be more then " + minutes + " mins " + seconds + " secs";
			throw response;
		}
	}

	//check for earliest startTime
	var earliestStartTime = new Date(startTime);
	earliestStartTime.setUTCHours(process.env.EARLIEST_BOOKING_HOUR);
	earliestStartTime.setUTCMinutes(0);

	if (startTime < earliestStartTime) {
		response.status = 400;
		response.message = "Booking cannot be earlier then 0" + process.env.EARLIEST_BOOKING_HOUR + ":00";
		throw response;
	}

	//check for latest endTime
	var latestEndTime = new Date(endTime);
	latestEndTime.setUTCHours(process.env.LATEST_BOOKING_HOUR);
	latestEndTime.setUTCMinutes(0);

	if (endTime > latestEndTime) {
		response.status = 400;
		response.message = "Booking cannot be later then " + process.env.LATEST_BOOKING_HOUR + ":00";
		throw response;
	}

	//check for retro booking (booing before current time)
	var now = new Date();
	now.setHours(now.getHours() + 8);
	if (endTime < now) {
		response.status = 400;
		response.message = "Booking cannot be in the past";
		throw response;
	}

	/*
	//check for minimum booking notice
	var latestAdvanceBooking = new Date(startTime);
	latestAdvanceBooking.setUTCHours(latestAdvanceBooking.getHours() - 12);
	latestAdvanceBooking.setUTCMinutes(0);
	var now = new Date();
	now.setHours(now.getHours() + 8);
	if (now > latestAdvanceBooking) {
		response.status = 400;
		response.message = "Must book 12 hours in advanced";
		throw response;
	}
	*/

	var booking = new Booking();
	booking.startTime = startTime;
	booking.endTime = endTime;
	
	//calculate pricing & currency
	const pricingTotalAmountInput = {
		"startTime": input.startTime,
		"endTime": input.endTime
	}
	const totalAmountObj = pricingService.calculateTotalAmount(pricingTotalAmountInput, user);
	booking.totalAmount = totalAmountObj.totalAmount;
	booking.currency = totalAmountObj.currency;

	//validate contact name
	if (input.contactName == null || input.contactName.length < 1) {
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

	const acceptedTelephoneCountryCodes = ["852", "853", "86"];
	if (acceptedTelephoneCountryCodes.includes(input.telephoneCountryCode) == false) {
		response.status = 400;
		response.message = "Invalid telephoneCountryCode";
		throw response;
	}
	booking.telephoneCountryCode = input.telephoneCountryCode;

	//validate telephone number
	if (input.telephoneNumber == null || input.telephoneNumber.length < 1) {
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

	//call external occupancy API to save occupancy record
	const url = process.env.OCCUPANCY_DOMAIN + process.env.OCCUPANCY_SUBDOMAIN;
	const data = {
		"occupancyType": "OPEN_BOOKING",
		"startTime": helper.dateToStandardString(booking.startTime),
		"endTime": helper.dateToStandardString(booking.endTime),
		"assetId": DEFAULT_ASSET_ID
	}
	const requestAttr = {
		method: "POST",
		body: JSON.stringify(data)
	}

	await helper.callAPI(url, requestAttr)
		.then(result => {
			booking.occupancyId = result.id;
			logger.info("Successfully call occupancy api, and saved occupancy record : " + result.id);
		})
		.catch(err => {
			response.status = 400;
			response.message = "timeslot not available";
			throw response;
		});

	booking.creationTime = new Date();
	booking.createdBy = user.id;
	booking.status = "AWAITING_PAYMENT";

	//save newBooking record
	await booking.save()
		.then(result => {
			booking = result;
			logger.info("Successfully saved new booking : " + booking.id);
		})
		.catch(err => {
			logger.error("booking.save() error : " + err);
			response.status = 500;
			response.message = "Add new booking function not available";
			throw response;
		});

	//send notification to admin
	if (process.env.SEND_NEW_BOOKING_ADMIN_NOTIFICATION_EMAIL == true) {
		const url = process.env.NOTIFICATION_DOMAIN + process.env.SEND_EMAIL_SUBDOMAIN;

		const linkToThankyouPage = "http://dev.www.hebewake.com/thank-you/" + booking.id;
		var bodyHTML = "<html>";
		bodyHTML += "<body>";
		bodyHTML += "<div>New Booking recieved form " + booking.contactName + "</div>";
		bodyHTML += "<div>" + booking.startTime + "&nbsp;to&nbsp;" + booking.endTime + "</div>";
		bodyHTML += "<div>Go to details <a href=" + linkToThankyouPage +">here</a></div>";
		bodyHTML += "</body>";
		bodyHTML += "</html>";

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
	if (process.env.SEND_NEW_BOOKING_CUSTOMER_CONFIRMATION_EMAIL == true) {
		const url = process.env.NOTIFICATION_DOMAIN + process.env.SEND_EMAIL_SUBDOMAIN;

		const linkToThankyouPage = "http://dev.www.hebewake.com/thank-you/" + booking.id;
		var bodyHTML = "<html>";
		bodyHTML += "<head>";
		bodyHTML += "</head>";
		bodyHTML += "<body>";
		bodyHTML += "<div>Thank you for booking with us.</div>";
		bodyHTML += "<div>You can view your booking details <a href=" + linkToThankyouPage +">here</a></div>";
		bodyHTML += "</body>";
		bodyHTML += "</html>";

		const data = {
			"sender": "booking@hebewake.com",
			"recipient": booking.emailAddress,
			"emailBody": bodyHTML
		}
		const requestAttr = {
			method: "POST",
			body: JSON.stringify(data)
		}

		await helper.callAPI(url, requestAttr)
			.then(result => {
				logger.info("Sucessfully sent new booking notification email to customer, messageId : " + result.messageId);
			})
			.catch(err => {
				logger.error("Failed to send new booking notification email to customer : " + JSON.stringify(err));
			});
	}

	var outputObj = bookingToOutuptObj(booking);

	return outputObj;
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
async function cancelBooking(input, user){
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
	if (input.bookingId == null || input.bookingId.length < 1) {
		response.status = 400;
		response.message = "bookingId is mandatory";
		throw(response);
	}

	var targetBooking;
	await Booking.findById(input.bookingId)
	.then(result => {
		targetBooking = result;
	})
	.catch(err => {
		logger.error("Error while finding target booking, running Booking.findById() error : " + err);
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
	const url = process.env.OCCUPANCY_DOMAIN + process.env.RELEASE_OCCUPANCY_SUBDOMAIN;
	const data = {
		"occupancyId": targetBooking.occupancyId
	}
	const requestAttr = {
		method: "DELETE",
		body: JSON.stringify(data)
	}

	await helper.callAPI(url, requestAttr)
		.catch(err => {
			throw err;
		});

	//delete booking record from db
	await Booking.findByIdAndDelete(targetBooking.id)
	.then(() => {
		logger.info("Deleted booking.id : " + targetBooking.id);
	})
	.catch(err => {
		logger.error("Error while deleting booking, running Booking.findByIdAndDelete() error : " + err);
		response.status = 500;
		response.message = "Cancel Booking Service not available";
		throw response;
	});

	//add new booking history
	const bookingHistory = new BookingHistory();
	bookingHistory.startTime = targetBooking.startTime;
	bookingHistory.endTime = targetBooking.endTime;
	bookingHistory.contactName = targetBooking.contactName;
	bookingHistory.telephoneCountryCode = targetBooking.telephoneCountryCode;
	bookingHistory.telephoneNumber = targetBooking.telephoneNumber;
	bookingHistory.emailAddress = targetBooking.emailAddress;
	bookingHistory.status = "CANCELLED";
	
	await bookingHistory.save()
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
	if (input.startTime == null || input.startTime.length < 1) {
		response.status = 400;
		response.message = "startTime is mandatory";
		throw response;	
	}

	var startTime;
	try {
		startTime = helper.standardStringToDate(input.startTime);
	} catch (err) {
		response.status = 400;
		response.message = "Invalid startTime format";
		throw response;	
	}

	if (input.endTime == null || input.endTime.length < 1) {
		response.status = 400;
		response.message = "endTime is mandatory";
		throw response;	
	}

	var endTime;
	try{
		endTime = helper.standardStringToDate(input.endTime);
	}catch(err){
		response.status = 400;
		response.message = "Invalid endTime format";
		throw response;	
	}

	if(startTime > endTime){
		response.status = 400;
		response.message = "Invalid endTime";
		throw response;
	}

	var bookings;
	await Booking.find({
		startTime: { $gte: startTime },
		endTime: { $lt: endTime }
	})
		.then(result => {
			bookings = result;
		})
		.catch(err => {
			logger.error("bookingHistoryModel.addNewBookingHistory() error : " + err);
			response.status = 500;
			response.message = "Cancel Booking Service not available";
			throw response;
		});

	var outputObjs = [];
	bookings.forEach((booking, index) => {
		const outputObj = bookingToOutuptObj(booking);
		outputObjs.push(outputObj);
	});

	return outputObjs;
}

async function findBookingById(input, user) {
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

	if (input.id == null || input.id.length < 1) {
		response.status = 400;
		response.message = "id is mandatory";
		throw response;
	}
	
	var booking;
	await Booking.findById(input.id)
		.then(result => {
			booking = result;
		})
		.catch(err => {
			logger.error("booking.findById error : " + err);
			response.status = 500;
			response.message = "Find Bookings Service not available";
			throw response;
		});

	const outputObj = bookingToOutuptObj(booking);

	return outputObj;
}

function bookingToOutuptObj(booking) {
	var outputObj = new Object();
	outputObj.id = booking._id;
	outputObj.creationTime = booking.creationTime;
	outputObj.createdBy = booking.createdBy;
	outputObj.occupancyId = booking.occupancyId;
	outputObj.startTime = helper.dateToStandardString(booking.startTime);
	outputObj.endTime = helper.dateToStandardString(booking.endTime);
	outputObj.totalAmount = booking.totalAmount;
	outputObj.currency = booking.currency;
	outputObj.contactName = booking.contactName;
	outputObj.telephoneCountryCode = booking.telephoneCountryCode;
	outputObj.telephoneNumber = booking.telephoneNumber;
	outputObj.emailAddress = booking.emailAddress;
	outputObj.status = booking.status;
	outputObj.durationInHours = Math.round((booking.endTime - booking.startTime) / 1000 / 60 / 60);

	return outputObj;
}
module.exports = {
	addNewBooking,
	cancelBooking,
	viewBookings,
	findBookingById
}
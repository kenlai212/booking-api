"use strict";
const mongoose = require("mongoose");
const Booking = require("./booking.model").Booking;
const BookingHistory = require("./booking-history.model").BookingHistory;
const common = require("gogowake-common");
const logger = common.logger;

const pricingService = require("../pricing/pricing.service");

require('dotenv').config();

const DEFAULT_ASSET_ID = "MC_NXT20";
const ACCEPTED_TELEPHONE_COUNTRY_CODES = ["852", "853", "86"];

//constants for user groups
const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN_GROUP";
const BOOKING_USER_GROUP = "BOOKING_USER_GROUP";

//constants for booking types
const OPEN_BOOKING_TYPE = "OPEN_BOOKING";
const PRIVATE_BOOKING_TYPE = "PRIVATE_BOOKING";
const VALID_BOOKING_TYPES = [OPEN_BOOKING_TYPE, PRIVATE_BOOKING_TYPE];

//constants for booking status
const AWAITING_CONFIRMATION_STATUS = "AWAITING_CONFIRMATION";
const CANCELLED_STATUS = "CANCELLED";
const FULFILLED_STATUS = "FULFILLED"

//constants for payment status
const AWAITING_PAYMENT_STATUS = "AWAITING_PAYMENT";
const PAID_STATUS = "PAID";

const OCCUPANCY_PATH = "/occupancy";
const SEND_EMAIL_PATH = "/email";
const RELEASE_OCCUPANCY_PATH = "/occupancy";
const CREW_PATH = "/crew";

/**
 * By : Ken Lai
 * Date : Mar 25, 2020
 * 
 * Add new booking record to database, then add a corrisponding
 * new occupancy record by calling occupancy service
 */
async function addNewBooking(input, user) {
	var response = new Object;
	const rightsGroup = [
		BOOKING_ADMIN_GROUP,
		BOOKING_USER_GROUP
	]

	//validate user group
	if (common.userAuthorization(user.groups, rightsGroup) == false) {
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
		startTime = common.standardStringToDate(input.startTime);
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
		endTime = common.standardStringToDate(input.endTime);
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

	//init booking object
	var booking = new Booking();

	const nowTimestampInUTC = common.getNowUTCTimeStamp();
	booking.creationTime = nowTimestampInUTC;

	booking.createdBy = user.id;

	booking.status = AWAITING_CONFIRMATION_STATUS;

	booking.history = [{
		transactionTime: common.getNowUTCTimeStamp(),
		transactionDescription: "New booking",
		userId: user.id,
		userName: user.name
	}]

	//check booking type, if none, assign default OPEN_BOOKING
	if (input.bookingType == null || input.bookingType.length < 0) {
		booking.bookingType = OPEN_BOOKING_TYPE
	} else {
		booking.bookingType = input.bookingType;
	}

	//check for valid booking type
	if (VALID_BOOKING_TYPES.includes(booking.bookingType) == false) {
		response.status = 400;
		response.message = "Invalid bookingType";
		throw response;		
	}

	//calculate duration in milliseconds
	var diffMs;
	diffMs = (endTime - startTime);

	if (booking.bookingType == OPEN_BOOKING_TYPE) {

		//check minimum booking duration
		const minMs = process.env.MINIMUM_BOOKING_TIME;
		if (diffMs < minMs) {

			var minutes = Math.floor(minMs / 60000);
			var seconds = ((minMs % 60000) / 1000).toFixed(0);

			response.status = 400;
			response.message = "Booking cannot be less then " + minutes + " mins " + seconds + " secs";
			throw response;
		}

		//check maximum booking duration
		if (process.env.CHECK_FOR_MAXIMUM_BOOKING_DURATION == true) {

			const maxMs = process.env.MAXIMUM_BOOKING_TIME

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

	booking.startTime = startTime;
	booking.endTime = endTime;
	
	//calculate pricing & currency
	const pricingTotalAmountInput = {
		"startTime": input.startTime,
		"endTime": input.endTime,
		"bookingType": booking.bookingType
	}
	const totalAmountObj = pricingService.calculateTotalAmount(pricingTotalAmountInput, user);
	booking.totalAmount = totalAmountObj.totalAmount;
	booking.currency = totalAmountObj.currency;
	booking.paymentStatus = AWAITING_PAYMENT_STATUS;

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

	if (ACCEPTED_TELEPHONE_COUNTRY_CODES.includes(input.telephoneCountryCode) == false) {
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

	//set email address if not null
	if(input.emailAddress != null){
		booking.emailAddress = input.emailAddress;
	}
	
	//set first guest as contact
	const firstGuest = {
		guestName: booking.contactName,
		telephoneCountryCode: booking.telephoneCountryCode,
		telephoneNumber: booking.telephoneNumber,
		emailAddress: booking.emailAddress
	}
	booking.guests = [firstGuest];

	//add crew //TODO auto add crew based on schedule
	booking.crews = new Array();

	//call external occupancy API to save occupancy record
	const url = process.env.OCCUPANCY_DOMAIN + OCCUPANCY_PATH;
	const data = {
		"occupancyType": OPEN_BOOKING_TYPE,
		"startTime": common.dateToStandardString(booking.startTime),
		"endTime": common.dateToStandardString(booking.endTime),
		"assetId": DEFAULT_ASSET_ID
	}
	const requestAttr = {
		method: "POST",
		headers: {
			"content-Type": "application/json",
			"Authorization": "Token " + user.accessToken
		},
		body: JSON.stringify(data)
	}

	await common.callAPI(url, requestAttr)
		.then(result => {
			booking.occupancyId = result.id;
			logger.info("Successfully call occupancy api, and saved occupancy record : " + result.id);
		})
		.catch(err => {
			throw err;
		});

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
		const url = process.env.NOTIFICATION_DOMAIN + SEND_EMAIL_PATH;

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
			headers: {
				"content-Type": "application/json",
				"Authorization": "Token " + global.accessToken
			},
			body: JSON.stringify(data)
		}

		await common.callAPI(url, requestAttr)
			.then(result => {
				logger.info("Successfully sent notification email to admin, messageId : " + result.messageId);
			})
			.catch(err => {
				logger.error("Failed to send new booking notification email to admin : " + JSON.stringify(err));
			});
	}

	//send confirmation to contact
	//TODO add chinese language confirmation
	if (process.env.SEND_NEW_BOOKING_CUSTOMER_CONFIRMATION_EMAIL == true && booking.emailAddress != null) {
		const url = process.env.NOTIFICATION_DOMAIN + SEND_EMAIL_PATH;

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
			headers: {
				"content-Type": "application/json",
				"Authorization": "Token " + global.accessToken
			},
			body: JSON.stringify(data)
		}

		await common.callAPI(url, requestAttr)
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
 * Date : June, 12 2020
 * 
 * fulfill the booking, by seting the fulfilledHours and setting the status to "FULFILLED"
 * add fulfill history record
 */
async function fulfillBooking(input, user) {
	var response = new Object;

	const rightsGroup = [
		BOOKING_ADMIN_GROUP
	]

	//validate user group
	if (common.userAuthorization(user.groups, rightsGroup) == false) {
		response.status = 401;
		response.message = "Insufficient Rights";
		throw response;
	}

	//validate bookingId
	if (input.bookingId == null || input.bookingId.length < 1) {
		response.status = 400;
		response.message = "bookingId is mandatory";
		throw (response);
	}

	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		response.status = 400;
		response.message = "Invalid bookingId";
		throw response;
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

	if (targetBooking == null) {
		response.status = 400;
		response.message = "Invalid bookingId";
		throw response;
	}

	if (input.fulfilledHours == null) {
		response.status = 400;
		response.message = "fulfillHours is mandatory";
		throw response;
	}

	//calculate duration in hours
	const diffTime = Math.abs(targetBooking.endTime - targetBooking.startTime);
	const durationInMinutes = Math.ceil(diffTime / (1000 * 60));
	const durationInHours = Math.ceil(durationInMinutes / 60);

	if (input.fulfilledHours > durationInHours) {
		response.status = 400;
		response.message = "fulfillHours cannot be greater then total duration hours";
		throw response;
	}

	targetBooking.fulfilledHours = input.fulfilledHours;
	targetBooking.status = FULFILLED_STATUS;

	const fulfilledHistory = {
		transactionTime: common.nowTimestampInUTC,
		transactionDescription: "Fulfilled booking",
		userId: user.id,
		userName: user.name
	}
	targetBooking.history.push(fulfilledHistory);

	await targetBooking.save()
		.then(() => {
			logger.info("Sucessfully fulfilled booking : " + booking.id);
		})
		.catch(err => {
			logger.error("Error while running booking.save() : " + err);
			response.status = 500;
			response.message = "booking.save() is not available";
			throw response;
		});

	return { "status": FULFILLED_STATUS };
}

/**
 * By : Ken Lai
 * Date : Mar 12, 2020
 * 
 * delete booking from database, delete the corrisponding occupancy record by calling occupancy service.
 */
async function cancelBooking(input, user){
	var response = new Object;

	const rightsGroup = [
		BOOKING_ADMIN_GROUP
	]

	//validate user group
	if (common.userAuthorization(user.groups, rightsGroup) == false) {
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

	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		response.status = 400;
		response.message = "Invalid bookingId";
		throw response;
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
	const url = process.env.OCCUPANCY_DOMAIN + RELEASE_OCCUPANCY_PATH;
	const data = {
		"occupancyId": targetBooking.occupancyId
	}
	const requestAttr = {
		method: "DELETE",
		headers: {
			"content-Type": "application/json",
			"Authorization": "Token " + user.accessToken
		},
		body: JSON.stringify(data)
	}

	await common.callAPI(url, requestAttr)
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
	bookingHistory.status = CANCELLED_STATUS;
	
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

	return {"status":"SUCCESS"};
}

async function removeGuest(input, user) {
	var response = new Object;
	const rightsGroup = [
		BOOKING_ADMIN_GROUP,
		BOOKING_USER_GROUP
	]

	//validate user group
	if (common.userAuthorization(user.groups, rightsGroup) == false) {
		response.status = 401;
		response.message = "Insufficient Rights";
		throw response;
	}

	if (input.bookingId == null || input.bookingId.length < 1) {
		response.status = 400;
		response.message = "bookingId is mandatory";
		throw response;
	}

	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		response.status = 400;
		response.message = "Invalid bookingId";
		throw response;
	}

	//find booking
	var booking;
	await Booking.findById(input.bookingId)
		.exec()
		.then(result => {
			booking = result;
		})
		.catch(err => {
			logger.error("Booking.findById() error : " + err);
			response.status = 500;
			response.message = "Booking.findById() is not available";
			throw response;
		});

	//if no booking found, it's a bad bookingId,
	if (booking == null) {
		response.status = 401;
		response.message = "Invalid bookingId";
		throw response;
	}

	//validate guestId
	if (input.guestId == null || input.guestId.length < 1) {
		response.status = 400;
		response.message = "guestId is mandatory";
		throw response;
	}

	var guests = booking.guests;
	var targetGuestName;
	guests.forEach((guest, index, object) => {
		if (guest._id == input.guestId) {
			targetGuestName = guest.guestName;
			object.splice(index, 1);
		}
	});
	booking.guests = guests;

	if (targetGuestName == null) {
		response.status = 400;
		response.message = "Invalid guestId";
		throw response;
	}

	//add transaction history
	const nowTimestampInUTC = common.getNowUTCTimeStamp();
	booking.history.push({
		transactionTime: nowTimestampInUTC,
		transactionDescription: "Removed guest : " + targetGuestName,
		userId: user.id
	});

	await booking.save()
		.then(() => {
			logger.info("Sucessfully removed guest from booking : " + booking.id);
		})
		.catch(err => {
			logger.error("Error while running booking.save() : " + err);
			response.status = 500;
			response.message = "booking.save() is not available";
			throw response;
		});

	return { "status": "SUCCESS" };
}

async function addGuest(input, user) {
	var response = new Object;
	const rightsGroup = [
		BOOKING_ADMIN_GROUP,
		BOOKING_USER_GROUP
	]

	//validate user group
	if (common.userAuthorization(user.groups, rightsGroup) == false) {
		response.status = 401;
		response.message = "Insufficient Rights";
		throw response;
	}

	//validate bookingId
	if (input.bookingId == null || input.bookingId.length < 1) {
		response.status = 400;
		response.message = "bookingId is mandatory";
		throw response;
	}

	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		response.status = 400;
		response.message = "Invalid bookingId";
		throw response;
	}

	//validate guest name
	if (input.guestName == null || input.guestName.length < 1) {
		response.status = 400;
		response.message = "guestName is mandatory";
		throw response;
	}

	//validate country code
	if (input.telephoneCountryCode == null || input.telephoneCountryCode.length < 1) {
		response.status = 400;
		response.message = "telephoneCountryCode is mandatory";
		throw response;
	}

	if (ACCEPTED_TELEPHONE_COUNTRY_CODES.includes(input.telephoneCountryCode) == false) {
		response.status = 400;
		response.message = "Invalid telephoneCountryCode";
		throw response;
	}

	//validate telephone number
	if (input.telephoneNumber == null || input.telephoneNumber.length < 1) {
		response.status = 400;
		response.message = "telephoneNumber is mandatory";
		throw response;
	}

	//find booking
	var booking;
	await Booking.findById(input.bookingId)
		.exec()
		.then(result => {
			booking = result;
		})
		.catch(err => {
			logger.error("Booking.findById() error : " + err);
			response.status = 500;
			response.message = "Booking.findById() is not available";
			throw response;
		});

	//if no booking found, it's a bad bookingId,
	if (booking == null) {
		response.status = 401;
		response.message = "Invalid bookingId";
		throw response;
	}

	//add guest
	const guest = {
		guestName: input.guestName,
		telephoneCountryCode: input.telephoneCountryCode,
		telephoneNumber: input.telephoneNumber,
		emailAddress: input.emailAddress
	}
	booking.guests.push(guest);

	//add transaction history
	const nowTimestampInUTC = common.getNowUTCTimeStamp();
	booking.history.push({
		transactionTime: nowTimestampInUTC,
		transactionDescription: "Added new guest : " + input.guestName,
		userId: user.id
	});

	await booking.save()
		.then(() => {
			logger.info("Sucessfully add guest to booking : " + booking.id);
		})
		.catch(err => {
			logger.error("Error while running booking.save() : " + err);
			response.status = 500;
			response.message = "booking.save() is not available";
			throw response;
		});

	return { "status": "SUCCESS" };
}

async function addCrew(input, user) {
	var response = new Object;
	const rightsGroup = [
		BOOKING_ADMIN_GROUP
	]

	//validate user group
	if (common.userAuthorization(user.groups, rightsGroup) == false) {
		response.status = 401;
		response.message = "Insufficient Rights";
		throw response;
	}

	if (input.bookingId == null || input.bookingId.length < 1) {
		response.status = 400;
		response.message = "bookingId is mandatory";
		throw response;
	}

	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		response.status = 400;
		response.message = "Invalid bookingId";
		throw response;
	}

	if (input.crewId == null || input.crewId.length < 1){
		response.status = 400;
		response.message = "crewId is mandatory";
		throw response;
	}

	//find booking
	var booking;
	await Booking.findById(input.bookingId)
		.exec()
		.then(result => {
			booking = result;
		})
		.catch(err => {
			logger.error("Booking.findById() error : " + err);
			response.status = 500;
			response.message = "Booking.findById() is not available";
			throw response;
		});

	//if no booking found, it's a bad bookingId,
	if (booking == null) {
		response.status = 401;
		response.message = "Invalid bookingId";
		throw response;
	}

	//find crew
	const url = process.env.OCCUPANCY_DOMAIN + CREW_PATH + "?crewId=" + input.crewId;
	const requestAttr = {
		method: "GET",
		headers: {
			"content-Type": "application/json",
			"Authorization": "Token " + global.accessToken
		}
	}

	var crew;
	await common.callAPI(url, requestAttr)
		.then(result => {
			crew = result;
		})
		.catch(err => {
			throw err;
		});

	if (crew == null || crew.id == null) {
		response.status = 400;
		response.message = "Invalid crewId";
		throw response;
	}

	//add crew
	if (booking.crews == null) {
		booking.crews = new Array();
	}

	const nowTimestampInUTC = common.getNowUTCTimeStamp();
	booking.crews.push({
		crewId: crew.id,
		crewName: crew.crewName,
		telephoneCountryCode: crew.telephoneCountryCode,
		telephoneNumber: crew.telephoneNumber,
		assignmentTime: nowTimestampInUTC,
		assignmentBy: user.id
	});

	//add transaction history
	booking.history.push({
		transactionTime: nowTimestampInUTC,
		transactionDescription: "Added new crew : " + input.crewId,
		userId: user.id
	});

	await booking.save()
		.then(() => {
			logger.info("Sucessfully add guest to booking : " + booking.id);
		})
		.catch(err => {
			logger.error("Error while running booking.save() : " + err);
			response.status = 500;
			response.message = "booking.save() is not available";
			throw response;
		});

	return { "status": "SUCCESS" };
}

async function changePaymentStatus(input, user) {
	var response = new Object;
	const rightsGroup = [
		BOOKING_ADMIN_GROUP
	]

	//validate user group
	if (common.userAuthorization(user.groups, rightsGroup) == false) {
		response.status = 401;
		response.message = "Insufficient Rights";
		throw response;
	}

	//validate intent
	if (input.intent == null || input.intent.length < 1) {
		response.status = 400;
		response.message = "intent is mandatory";
		throw response;
	}

	const MARK_PAID = "MARK_PAID";
	const REVERSE_PAID = "REVERSE_PAID";
	const validIntents = [MARK_PAID, REVERSE_PAID]
	if (validIntents.includes(input.intent) == false) {
		response.status = 400;
		response.message = "Invalid intent";
		throw response;
	}

	//validate bookingId
	if (input.bookingId == null || input.bookingId.length < 1) {
		response.status = 400;
		response.message = "bookingId is mandatory";
		throw response;
	}

	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		response.status = 400;
		response.message = "Invalid bookingId";
		throw response;
	}

	//find booking
	var booking;
	await Booking.findById(input.bookingId)
		.exec()
		.then(result => {
			booking = result;
		})
		.catch(err => {
			logger.error("Booking.findById() error : " + err);
			response.status = 500;
			response.message = "Booking.findById() is not available";
			throw response;
		});

	//if no booking found, it's a bad bookingId,
	if (booking == null) {
		response.status = 401;
		response.message = "Invalid bookingId";
		throw response;
	}

	//set payment status to PAID or AWAITING_PAYMENT_STATUS
	if (input.intent == MARK_PAID) {
		booking.paymentStatus = PAID_STATUS;
	} else if (input.intent == REVERSE_PAID) {
		booking.paymentStatus = AWAITING_PAYMENT_STATUS;
	}
	
	//add transaction history
	var transactionHistory = new Object();
	const nowTimestampInUTC = common.getNowUTCTimeStamp();
	transactionHistory.transactionTime = nowTimestampInUTC;
	transactionHistory.userId = user.id;
	if (input.intent == MARK_PAID) {
		transactionHistory.transactionDescription = "paymentStatus changed to PAID"
	} else if (input.intent == REVERSE_PAID) {
		transactionHistory.transactionDescription = "paymentStatus reversed to AWAITING_PAYMENT"
	}
	booking.history.push(transactionHistory);

	await booking.save()
		.then(() => {
			logger.info("Sucessfully updated PAID status for booking : " + booking.id);
		})
		.catch(err => {
			logger.error("Error while running booking.save() : " + err);
			response.status = 500;
			response.message = "booking.save() is not available";
			throw response;
		});

	return { "paymentStatus": booking.paymentStatus };
}

/**
 * By : Ken Lai
 * Date : Mar 01, 2020
 * 
 * Returns all bookings withint a datetime range
 */
async function viewBookings(input, user){
	var response = new Object;
	const rightsGroup = [
		BOOKING_ADMIN_GROUP
	]

	//validate user group
	if (common.userAuthorization(user.groups, rightsGroup) == false) {
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
		startTime = common.standardStringToDate(input.startTime);
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
		endTime = common.standardStringToDate(input.endTime);
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
	}).sort("startTime")
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
	bookings.forEach((booking) => {
		const outputObj = bookingToOutuptObj(booking);
		outputObjs.push(outputObj);
	});

	return { "bookings" : outputObjs };
}

async function findBookingById(input, user) {
	var response = new Object;
	const rightsGroup = [
		BOOKING_ADMIN_GROUP,
		BOOKING_USER_GROUP
	]

	//validate user group
	if (common.userAuthorization(user.groups, rightsGroup) == false) {
		response.status = 401;
		response.message = "Insufficient Rights";
		throw response;
	}

	if (input.bookingId == null || input.bookingId.length < 1) {
		response.status = 400;
		response.message = "bookingId is mandatory";
		throw response;
	}

	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		response.status = 400;
		response.message = "Invalid bookingId";
		throw response;
	}

	var booking;
	await Booking.findById(input.bookingId)
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
	outputObj.bookingType = booking.bookingType;
	outputObj.creationTime = booking.creationTime;
	outputObj.createdBy = booking.createdBy;
	outputObj.occupancyId = booking.occupancyId;
	outputObj.startTime = common.dateToStandardString(booking.startTime);
	outputObj.endTime = common.dateToStandardString(booking.endTime);
	outputObj.totalAmount = booking.totalAmount;
	outputObj.currency = booking.currency;
	outputObj.contactName = booking.contactName;
	outputObj.telephoneCountryCode = booking.telephoneCountryCode;
	outputObj.telephoneNumber = booking.telephoneNumber;
	outputObj.emailAddress = booking.emailAddress;
	outputObj.status = booking.status;
	outputObj.paymentStatus = booking.paymentStatus;
	outputObj.durationInHours = Math.round((booking.endTime - booking.startTime) / 1000 / 60 / 60);
	outputObj.guests = booking.guests;
	outputObj.history = booking.history;
	outputObj.crews = booking.crews;

	return outputObj;
}

module.exports = {
	addNewBooking,
	changePaymentStatus,
	addGuest,
	removeGuest,
	addCrew,
	cancelBooking,
	fulfillBooking,
	viewBookings,
	findBookingById
}
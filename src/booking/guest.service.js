"use strict";
const Joi = require("joi");
var uuid = require('uuid');
const mongoose = require("mongoose");
const Booking = require("./booking.model").Booking;
const bookingCommon = require("./booking.common");
const gogowakeCommon = require("gogowake-common");
const logger = gogowakeCommon.logger;

const SEND_EMAIL_PATH = "/email";
const SEND_SMS_PATH = "/sms";

async function removeGuest(input, user) {

	//validate user group
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]
	if (gogowakeCommon.userAuthorization(user.groups, rightsGroup) == false) {
		throw { status: 401, message: "Insufficient Rights"};
	}

	//validate input data
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required(),
		guestId: Joi.string().min(1).required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { status: 400, message: result.error.details[0].message.replace(/\"/g, '')};
	}

	//check bookingId format
	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		throw { status: 404, message: "Booking not found, invalid bookingId" };
	}

	//find booking
	var booking;
	await Booking.findById(input.bookingId)
		.then(result => {
			booking = result;
		})
		.catch(err => {
			const referenceId = uuid.v4();
			logger.error("Ref: "+ referenceId +"; Booking.findById() error : " + err);
			throw { status: 500, message: "Internal Service error. Reference ID : " + referenceId};
		});
	
	//if no booking found, it's a bad bookingId,
	if (booking == null) {
		throw { status: 404, message: "Booking not found" };
	}

	var targetGuest;
	if (booking.guests != null && booking.guests.length > 0) {
		booking.guests.forEach((guest, index, object) => {
			if (guest._id == input.guestId) {
				targetGuest = guest;
				object.splice(index, 1);
			}
		});
	}
	
	//validate guestId
	if (targetGuest == null) {
		throw { status: 404, message: "Guest not found" };
	}
	
	//add transaction history
	if (booking.history == null) {
		booking.history = [];
	}
	booking.history.push({
		transactionTime: gogowakeCommon.getNowUTCTimeStamp(),
		transactionDescription: "Removed guest : " + targetGuest.guestName,
		userId: user.id,
		userName: user.name
	});

	//saving booking
	await booking.save()
		.then(() => {
			logger.info("Sucessfully removed guest from booking : " + booking.id);
		})
		.catch(err => {
			const referenceId = uuid.v4();
			logger.error("Ref: " + referenceId + "; booking.save() error : " + err);
			throw { status: 500, message: "Internal Service error. Reference ID : " + referenceId };
		});

	return booking;
}

async function addGuest(input, user) {
	
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]

	//validate user group
	if (gogowakeCommon.userAuthorization(user.groups, rightsGroup) == false) {
		throw { status: 401, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		bookingId: Joi.string().min(1).required(),
		guestName: Joi.string().min(1).required(),
		telephoneCountryCode: Joi.string().min(1).required(),
		telephoneNumber: Joi.string().min(1).required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { status: 400, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		throw { status: 400, message: "Invalid bookingId" };
	}

	//validate country code
	if (bookingCommon.ACCEPTED_TELEPHONE_COUNTRY_CODES.includes(input.telephoneCountryCode) == false) {
		throw { status: 400, message: "Invalid telephoneCountryCode" };
	}

	//find booking
	var booking;
	await Booking.findById(input.bookingId)
		.then(result => {
			booking = result;
		})
		.catch(err => {
			const referenceId = uuid.v4();
			logger.error("Ref: " + referenceId + "; Booking.findById() error : " + err);
			throw { status: 500, message: "Internal Service error. Reference ID : " + referenceId };
		});

	//if no booking found, it's a bad bookingId,
	if (booking == null) {
		throw { status: 404, message: "Booking not found" };
	}

	//add guest
	if (booking.guests == null) {
		booking.guests = [];
	}
	const guest = {
		guestName: input.guestName,
		telephoneCountryCode: input.telephoneCountryCode,
		telephoneNumber: input.telephoneNumber,
		emailAddress: input.emailAddress
	}
	booking.guests.push(guest);

	//add transaction history
	if (booking.history == null) {
		booking.history = [];
	}
	booking.history.push({
		transactionTime: gogowakeCommon.getNowUTCTimeStamp(),
		transactionDescription: "Added new guest : " + input.guestName,
		userId: user.id,
		userName: user.name
	});

	//saving booking
	await booking.save()
		.then(() => {
			logger.info("Sucessfully removed guest from booking : " + booking.id);
		})
		.catch(err => {
			const referenceId = uuid.v4();
			logger.error("Ref: " + referenceId + "; booking.save() error : " + err);
			throw { status: 500, message: "Internal Service error. Reference ID : " + referenceId };
		});

	return booking;
}

/**
 * By : Ken Lai
 * Date : Jul 23, 2020
 */
async function editGuest(input, user) {

	var response = new Object;
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]

	//validate user group
	if (gogowakeCommon.userAuthorization(user.groups, rightsGroup) == false) {
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

	if (bookingCommon.ACCEPTED_TELEPHONE_COUNTRY_CODES.includes(input.telephoneCountryCode) == false) {
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

	var guestFound = false;
	booking.guests.forEach(guest => {
		if (guest._id == input.guestId) {
			guestFound = true;

			guest.guestName = input.guestName;
			guest.telephoneCountryCode = input.telephoneCountryCode;
			guest.telephoneNumber = input.telephoneNumber;
			guest.emailAddress = input.emailAddress;
		}
	});

	if (guestFound == false) {
		response.status = 400;
		response.message = "Invalid guestId";
		throw response;
	}

	//add transaction history
	booking.history.push({
		transactionTime: gogowakeCommon.getNowUTCTimeStamp(),
		transactionDescription: "Edited guest : " + input.guestName,
		userId: user.id,
		userName: user.name
	});

	await booking.save()
		.then(() => {
			logger.info("Sucessfully edited guest in booking : " + booking.id);
		})
		.catch(err => {
			logger.error("Error while running booking.save() : " + err);
			response.status = 500;
			response.message = "booking.save() is not available";
			throw response;
		});

	return { "status": "SUCCESS" };
}

/**
 * By: Ken Lai
 * Date : July 28, 2020
 * 
 * Public api. Customer can signDisclaimer without signing in 
 */
async function signDisclaimer(input) {
	var response = new Object;

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
		response.status = 400;
		response.message = "Invalid bookingId";
		throw response;
	}

	//validate disclaimerId
	if (input.disclaimerId == null || input.disclaimerId.length == 0) {
		response.status = 400;
		response.message = "disclaimerId is mandatory";
		throw response;
	}

	var guestFound = false;
	var guestId;
	booking.guests.forEach(guest => {
		if (guest.disclaimerId == input.disclaimerId) {
			guestFound = true;
			guestId = guest._id;
			guest.signedDisclaimerTimeStamp = gogowakeCommon.getNowUTCTimeStamp();
		}
	});

	if (guestFound == false) {
		response.status = 400;
		response.message = "Invalid disclaimerId";
		throw response;
	}

	//add transaction history
	var transactionHistory = new Object();
	transactionHistory.transactionTime = gogowakeCommon.getNowUTCTimeStamp();
	transactionHistory.transactionDescription = "Guest signed disclaimer. GuestId : " + guestId;
	booking.history.push(transactionHistory);

	await booking.save()
		.then(() => {
			logger.info("Sucessfully updated guest signedDisclaimerTimeStamp booking : " + booking.id + ", guestId : " + guestId);
		})
		.catch(err => {
			logger.error("Error while running booking.save() : " + err);
			response.status = 500;
			response.message = "booking.save() is not available";
			throw response;
		});

	return { "status": "SUCCESS" };
}

/**
 * By : Ken Lai
 * Date: July 12, 2020
 */
async function sendDisclaimer(input, user) {

	var response = new Object;
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]

	//validate user group
	if (gogowakeCommon.userAuthorization(user.groups, rightsGroup) == false) {
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
		response.status = 400;
		response.message = "Invalid bookingId";
		throw response;
	}

	//validate guestId
	if (input.guestId == null || input.guestId.length < 1) {
		response.status = 400;
		response.message = "guestId is mandatory";
		throw response;
	}

	const disclaimerId = uuid.v4();

	var guest;
	booking.guests.forEach(item => {
		if (item._id == input.guestId) {
			item.disclaimerId = disclaimerId;
			guest = item;
		}
	});

	if (guest == null) {
		response.status = 400;
		response.message = "Invalid guestId";
		throw response;
	}

	//update guest.disclaimerId
	var transactionHistory = new Object();
	transactionHistory.transactionTime = gogowakeCommon.getNowUTCTimeStamp();
	transactionHistory.userId = user.id;
	transactionHistory.userName = user.name;
	transactionHistory.transactionDescription = "Send disclaimer to guest : " + guest.guestName + "(" + guest.telephoneNumber + ")";
	booking.history.push(transactionHistory);

	await booking.save()
		.then(() => {
			logger.info("Sucessfully updated disclaimerId for guest : " + guest.guestName + " in booking : " + booking._id);
		})
		.catch(err => {
			logger.error("Error while running booking.save() : " + err);
			response.status = 500;
			response.message = "booking.save() is not available";
			throw response;
		});

	//send sms
	const disclaimerURL = process.env.DISCLAIMER_URL + "?disclaimerId=" + disclaimerId + "&bookingId=" + booking._id;
	const number = guest.telephoneCountryCode + guest.telephoneNumber;
	const data = {
		"message": "Please read and acknowledge our disclaimer - " + disclaimerURL,
		"number": number,
		"subject": "GOGOWAKE"
	}

	const requestAttr = {
		method: "POST",
		headers: {
			"content-Type": "application/json",
			"Authorization": "Token " + user.accessToken
		},
		body: JSON.stringify(data)
	}

	const apiURL = process.env.NOTIFICATION_DOMAIN + SEND_SMS_PATH;

	await gogowakeCommon.callAPI(apiURL, requestAttr)
		.then(result => {
			logger.info("Successfully sent disclaimer msg to recipient : " + number + " , messageId : " + result.messageId);
		})
		.catch(err => {
			logger.error("Failed to send disclaimer : " + JSON.stringify(err));
			response.status = 500;
			response.message = "Send SMS API is not available";
			throw response;
		});

	return { "status": "SUCCESS" };
}

module.exports = {
	addGuest,
	removeGuest,
	editGuest,
	signDisclaimer,
	sendDisclaimer
}

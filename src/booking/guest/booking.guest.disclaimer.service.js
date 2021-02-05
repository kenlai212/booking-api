"use strict";
const Joi = require("joi");
var uuid = require("uuid");
const moment = require("moment");

const utility = require("../../common/utility");
const customError = require("../../common/customError");
const logger = require("../../common/logger").logger;

const bookingCommon = require("../booking.common");
const notificationHelper = require("../notification_internal.helper");

async function signDisclaimer(input) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		disclaimerId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	//find booking
	let booking = await bookingCommon.getBooking(input.bookingId);

	let targetGuest;
	booking.guests.forEach(guest => {
		if (guest.disclaimerId == input.disclaimerId) {
			//set signed timestamp
			guest.signedDisclaimerTimeStamp = moment().toDate();

			targetGuest = guest;
		}
	});

	if (targetGuest == null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid disclaimerId" };
	}

	//update booking record
	const bookingOutput = bookingCommon.saveBooking(booking);

	//add history item
	bookingCommon.addBookingHistoryItem(bookingOutput.id, `Guest signed disclaimer ${JSON.stringify(targetGuest)} from booking(${bookingOutput.id})`, user);

	return bookingOutput;
}

async function sendDisclaimer(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		guestId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	//get booking
	let booking = await bookingCommon.getBooking(input.bookingId);
	
	//find target guest from booking.guests list, assign disclaimerId
	let targetGuest;
	booking.guests.forEach(guest => {
		if (guest._id === input.guestId) {
			guest.disclaimerId = uuid.v4();
			targetGuest = guest;
		}
	});

	if (!targetGuest)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid guestId" };

	//update booking record
	const bookingOutput = bookingCommon.saveBooking(booking);

	//send disclaimer notification
	try {
		await notificationHelper.sendDisclaimerNotification(booking._id, targetGuest.disclaimerId, targetGuest.telephoneNumber);
	} catch (err) {
		console.log(err);
		logger.error(`Booking(${bookingOutput.id}) updated with disclaimerId(${bookingOutput.disclaimerId}), but failed notificationHelper.sendDisclaimerNotification. Please send notification manually`);
	}

	return {"status": "SUCCESS"}
}

module.exports = {
	signDisclaimer,
	sendDisclaimer
}
"use strict";
const mongoose = require("mongoose");
const gogowakeCommon = require("gogowake-common");
const Booking = require("./booking.model").Booking;

//constants for user groups
const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN_GROUP";
const BOOKING_USER_GROUP = "BOOKING_USER_GROUP";

const ACCEPTED_TELEPHONE_COUNTRY_CODES = ["852", "853", "86"];

async function validateBookingIdInput(input) {
	var response = new Object;

	//validate bookingId
	if (input.bookingId == null || input.bookingId.length == 0) {
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
		response.message = "Invalid booking ID";
		throw response;
	}
}

function bookingToOutputObj(booking) {
	var outputObj = new Object();
	outputObj.id = booking._id;
	outputObj.bookingType = booking.bookingType;
	outputObj.creationTime = booking.creationTime;
	outputObj.createdBy = booking.createdBy;
	outputObj.occupancyId = booking.occupancyId;
	outputObj.startTime = gogowakeCommon.dateToStandardString(booking.startTime);
	outputObj.endTime = gogowakeCommon.dateToStandardString(booking.endTime);
	outputObj.totalAmount = booking.totalAmount;
	outputObj.discountedAmount = booking.discountedAmount;
	outputObj.collectedAmount = booking.collectedAmount;
	outputObj.currency = booking.currency;
	outputObj.contactName = booking.contactName;
	outputObj.telephoneCountryCode = booking.telephoneCountryCode;
	outputObj.telephoneNumber = booking.telephoneNumber;
	outputObj.emailAddress = booking.emailAddress;
	outputObj.status = booking.status;
	outputObj.paymentStatus = booking.paymentStatus;
	outputObj.durationInHours = Math.round((booking.endTime - booking.startTime) / 1000 / 60 / 60);
	outputObj.fulfilledHours = booking.fulfilledHours;
	outputObj.guests = booking.guests;
	outputObj.history = booking.history;
	outputObj.crews = booking.crews;

	return outputObj;
}

module.exports = {
	BOOKING_ADMIN_GROUP,
	BOOKING_USER_GROUP,
	ACCEPTED_TELEPHONE_COUNTRY_CODES,
	validateBookingIdInput,
	bookingToOutputObj
}
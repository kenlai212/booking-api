"use strict";
const moment = require("moment");

//constants for user groups
const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN_GROUP";
const BOOKING_USER_GROUP = "BOOKING_USER_GROUP";

const ACCEPTED_TELEPHONE_COUNTRY_CODES = ["852", "853", "86"];

function bookingToOutputObj(booking) {
	var outputObj = new Object();
	outputObj.id = booking._id;
	outputObj.bookingType = booking.bookingType;
	outputObj.creationTime = booking.creationTime;
	outputObj.createdBy = booking.createdBy;
	outputObj.occupancyId = booking.occupancyId;
	outputObj.startTime = moment(booking.startTime).toISOString();
	outputObj.endTime = moment(booking.endTime).toISOString();
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
	bookingToOutputObj
}

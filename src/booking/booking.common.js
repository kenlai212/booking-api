"use strict";
const moment = require("moment");

//constants for user groups
const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";
const BOOKING_USER_GROUP = "BOOKING_USER";

const ACCEPTED_TELEPHONE_COUNTRY_CODES = ["852", "853", "86"];

function bookingToOutputObj(booking) {
	var outputObj = new Object();
	outputObj.id = booking._id;
	outputObj.bookingType = booking.bookingType;
	outputObj.creationTime = booking.creationTime;
	outputObj.createdBy = booking.createdBy;
	outputObj.occupancyId = booking.occupancyId;
	outputObj.status = booking.status;

	outputObj.regularAmount = booking.regularAmount;
	outputObj.discountAmount = booking.discountAmount;
	outputObj.totalAmount = booking.totalAmount;
	outputObj.paidAmount = booking.paidAmount;
	outputObj.balance = booking.balance;
	outputObj.currency = booking.currency;
	outputObj.unitPrice = booking.unitPrice;
	outputObj.paymentStatus = booking.paymentStatus;

	outputObj.startTime = booking.startTime;
	outputObj.endTime = booking.endTime;
	outputObj.durationByHours = booking.durationByHours;
	outputObj.fulfilledHours = booking.fulfilledHours;

	outputObj.host = new Object();
	outputObj.host.hostName = booking.host.hostName;
	outputObj.host.telephoneCountryCode = booking.host.telephoneCountryCode;
	outputObj.host.telephoneNumber = booking.host.telephoneNumber;
	outputObj.host.emailAddress = booking.host.emailAddress;

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

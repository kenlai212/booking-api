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
	outputObj.status = booking.status;

	outputObj.totalAmount = booking.totalAmount;
	outputObj.discountedAmount = booking.discountedAmount;
	outputObj.paidAmount = booking.paidAmount;
	outputObj.currency = booking.currency;
	outputObj.paymentStatus = booking.paymentStatus;

	outputObj.startTime = moment(booking.startTime).toISOString();
	outputObj.endTime = moment(booking.endTime).toISOString();
	outputObj.durationInHours = Math.round((booking.endTime - booking.startTime) / 1000 / 60 / 60);
	outputObj.fulfilledHours = booking.fulfilledHours;

	outputObj.contact = new Object();
	outputObj.contact.contactName = booking.contact.contactName;
	outputObj.contact.telephoneCountryCode = booking.contact.telephoneCountryCode;
	outputObj.contact.telephoneNumber = booking.contact.telephoneNumber;
	outputObj.contact.emailAddress = booking.contact.emailAddress;

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

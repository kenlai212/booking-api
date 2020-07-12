"use strict";
const common = require("gogowake-common");

require('dotenv').config();

const CUSTOMER_BOOKING = "CUSTOMER_BOOKING";
const OWNER_BOOKING = "OWNER_BOOKING";
const validBookingType = [CUSTOMER_BOOKING, OWNER_BOOKING];

function calculateTotalAmount(input, user) {
	var response = new Object;
	const rightsGroup = [
		"BOOKING_ADMIN_GROUP",
		"BOOKING_USER_GROUP"
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
		response.message = "Invalid endTime format";
		throw response;
	}

	//check if endTime is earlier then startTime
	if (startTime > endTime) {
		response.status = 400;
		response.message = "Invalid endTime";
		throw response;
	}

	//if bookingType is null, default to CUSTOMER_BOOKING
	if (input.bookingType == null || input.bookingType.length < 1) {
		input.bookingType = CUSTOMER_BOOKING;
	}

	if (validBookingType.includes(input.bookingType) == false) {
		response.status = 400;
		response.message = "Invalid bookingType";
		throw response;
	}

	//calculate duration in hours
	const diffTime = Math.abs(endTime - startTime);
	const durationInMinutes = Math.ceil(diffTime / (1000 * 60));
	const durationInHours = Math.ceil(durationInMinutes / 60);

	//calculate total amount for OPEN_BOOKING. If PRIVATE_BOOKING then default to 0 totalAmount
	var totalAmount;
	if (input.bookingType == CUSTOMER_BOOKING) {
		totalAmount = durationInHours * process.env.UNIT_PRICE_REGULAR;

		//check weekday or weekend
		if (startTime.getDay() != 6 && startTime.getDay() != 0) {
			totalAmount = durationInHours * process.env.UNIT_PRICE_DISCOUNT_WEEKDAY;
		}
	} else {
		totalAmount = durationInHours * process.env.UNTI_PRICE_OWNER_BOOKING;
	}
	
    return { "totalAmount": totalAmount, "currency": process.env.UNIT_CURRENCY };
}

module.exports = {
    calculateTotalAmount
}
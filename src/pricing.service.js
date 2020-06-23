"use strict";
const common = require("gogowake-common");

require('dotenv').config();

const OPEN_BOOKING = "OPEN_BOOKING";
const PRIVATE_BOOKING = "PRIVATE_BOOKING";
const validBookingType = [OPEN_BOOKING, PRIVATE_BOOKING];

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

	//if bookingType is null, default to OPEN_BOOKING
	if (input.bookingType == null || input.bookingType.length < 1) {
		input.bookingType = OPEN_BOOKING;
	}

	if (validBookingType.includes(input.bookingType) == false) {
		response.status = 400;
		response.message = "Invalid bookingType";
		throw response;
	}

	//calculate total amount for OPEN_BOOKING. If PRIVATE_BOOKING then default to 0 totalAmount
	var totalAmount;
	if (input.bookingType == OPEN_BOOKING) {
		//calculate duration in hours
		const diffTime = Math.abs(endTime - startTime);
		const durationInMinutes = Math.ceil(diffTime / (1000 * 60));
		const durationInHours = Math.ceil(durationInMinutes / 60);

		totalAmount = durationInHours * process.env.UNIT_PRICE_REGULAR;

		//check weekday or weekend
		if (startTime.getDay() != 6 && startTime.getDay() != 0) {
			totalAmount = durationInHours * process.env.UNIT_PRICE_DISCOUNT_WEEKDAY;
		}
	} else {
		totalAmount = 0;
	}
	
    return { "totalAmount": totalAmount, "currency": process.env.UNIT_CURRENCY };
}

module.exports = {
    calculateTotalAmount
}
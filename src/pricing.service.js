"use strict";
const logger = require("./logger");
const helper = require("./helper");

require('dotenv').config();

function calculateTotalAmount(input, user) {
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
		response.message = "Invalid endTime format";
		throw response;
	}

	//check if endTime is earlier then startTime
	if (startTime > endTime) {
		response.status = 400;
		response.message = "Invalid endTime";
		throw response;
	}

	//check minimum booking duration
	const diffTime = Math.abs(endTime - startTime);
	const durationInMinutes = Math.ceil(diffTime / (1000 * 60));
	if (durationInMinutes < process.env.MINIMUM_BOOKING_DURATION_MINUTES) {
		response.status = 400;
		response.message = "booking duration cannot be less then " + process.env.MINIMUM_BOOKING_DURATION_MINUTES + " minutes";
		throw response;
	}

	//check maximum booking duration
	if (process.env.CHECK_FOR_MAXIMUM_BOOKING_DURATION == true) {
		if (durationInMinutes > process.env.MAXIMUM_BOOKING_DURATION_MINUTES) {
			response.status = 400;
			response.message = "booking duration cannot be more then " + process.env.MAXIMUM_BOOKING_DURATION_MINUTES + " minutes";
			throw response;
		}
	}

    const durationInHours = Math.round(durationInMinutes / 60);

    const totalAmount = durationInHours * process.env.UNIT_PRICE;

    return { "totalAmount": totalAmount, "currency": process.env.UNIT_CURRENCY };
}

module.exports = {
    calculateTotalAmount
}
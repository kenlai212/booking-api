"use strict";
const Joi = require("joi");
const config = require("config");

const utility = require("../common/utility");
const customError = require("../common/customError");
const userAuthorization = require("../common/middleware/userAuthorization");

const CUSTOMER_BOOKING = "CUSTOMER_BOOKING";
const OWNER_BOOKING = "OWNER_BOOKING";

function calculateTotalAmount(input, user) {
	const rightsGroup = [
		"PRICING_ADMIN_GROUP",
		"PRICING_USER_GROUP"
	]
	
	//validate user group
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { status: 401, message: "Insufficient Rights"};
	}

	//validate input data
	const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
		bookingType: Joi
			.string()
			.required()
			.valid(CUSTOMER_BOOKING, OWNER_BOOKING)
	});
	
	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	const startTime = utility.isoStrToDate(input.startTime, input.utcOffset);
	const endTime = utility.isoStrToDate(input.endTime, input.utcOffset);

	//startTime cannot be later then endTime
	if (startTime > endTime) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "endTime cannot be earlier then startTime" };
	}
	
	//calculate duration in hours
	const diffTime = Math.abs(endTime - startTime);
	const durationInMinutes = Math.ceil(diffTime / (1000 * 60));
	//const durationInHours = Math.ceil(durationInMinutes / 60);
	const durationInHours = Math.round((durationInMinutes / 60) * 2) / 2;

	//calculate total amount for CUSTOMER_BOOKING or OWNER_BOOKING
	var totalAmount;
	if (input.bookingType == CUSTOMER_BOOKING) {
		totalAmount = durationInHours * config.get("pricing.unitPriceRegular");
		
		//check weekday or weekend
		if (startTime.getDay() != 6 && startTime.getDay() != 0) {
			totalAmount = durationInHours * config.get("pricing.unitPriceDiscounted");
		}
	} else {
		totalAmount = durationInHours * config.get("pricing.unitPriceOwnerBooking");
	}
	
	return { "totalAmount": totalAmount, "totalHours": durationInHours, "currency": config.get("pricing.unitCurrency") };
}

module.exports = {
    calculateTotalAmount
}
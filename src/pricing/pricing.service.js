"use strict";
const Joi = require("joi");
const config = require("config");

const utility = require("../common/utility");
const customError = require("../common/customError");
const userAuthorization = require("../common/middleware/userAuthorization");

const CUSTOMER_BOOKING = "CUSTOMER_BOOKING";
const OWNER_BOOKING = "OWNER_BOOKING";

const PRICING_ADMIN_GROUP = "PRICING_ADMIN";
const PRICING_USER_GROUP = "PRICING_USER";

function calculateTotalAmount(input, user) {
	const rightsGroup = [
		PRICING_ADMIN_GROUP,
		PRICING_USER_GROUP
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
	const durationByMinutes = Math.ceil(diffTime / (1000 * 60));
	const durationByHours = Math.round((durationByMinutes / 60) * 2) / 2;

	//define unitPrice for (CUSTOMER_BOOKING or OWNER_BOOKING) and (weekdays or holidays)
	let unitPrice;
	if (input.bookingType == CUSTOMER_BOOKING) {
		unitPrice = config.get("pricing.unitPriceRegular");
		
		//check weekday or holidays
		if (startTime.getDay() != 6 && startTime.getDay() != 0) {
			unitPrice = config.get("pricing.unitPriceDiscounted");
		}
	} else {
		unitPrice = config.get("pricing.unitPriceOwnerBooking");
	}

	//calculate regular and total maount
	const regularAmount = durationByHours * unitPrice;
	const discountAmount = 0;
	const totalAmount = regularAmount - discountAmount;
	
	return {
		"regularAmount": regularAmount,
		"discountAmount": discountAmount,
		"totalAmount": totalAmount,
		"durationByHours": durationByHours,
		"unitPrice": unitPrice,
		"currency": config.get("pricing.unitCurrency")
	};
}

module.exports = {
    calculateTotalAmount
}
"use strict";
const common = require("gogowake-common");

const CUSTOMER_BOOKING = "CUSTOMER_BOOKING";
const OWNER_BOOKING = "OWNER_BOOKING";

function calculateTotalAmount(input, user) {
	const rightsGroup = [
		"BOOKING_ADMIN_GROUP",
		"BOOKING_USER_GROUP"
	]

	//validate user group
	if (common.userAuthorization(user.groups, rightsGroup) == false) {
		throw { status: 401, message: "Insufficient Rights"};
	}

	//validate input data
	const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		bookingType: Joi
			.string()
			.required()
			.valid(CUSTOMER_BOOKING, OWNER_BOOKING)
	});

	const result = schema.validate(input);
	if (result.error) {
		reject({ status: 400, message: result.error.details[0].message.replace(/\"/g, '') });
	}

	const startTime = moment(input.startTime).toDate();
	const endTime = moment(input.endTime).toDate();

	//startTime cannot be later then endTime
	if (startTime > endTime) {
		reject({ status: 400, message: "endTime cannot be earlier then startTime" });
	}

	//calculate duration in hours
	const diffTime = Math.abs(endTime - startTime);
	const durationInMinutes = Math.ceil(diffTime / (1000 * 60));
	const durationInHours = Math.ceil(durationInMinutes / 60);

	//calculate total amount for CUSTOMER_BOOKING or OWNER_BOOKING
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
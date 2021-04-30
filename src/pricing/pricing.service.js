"use strict";
const Joi = require("joi");
const config = require("config");

const utility = require("../common/utility");
const {customError} = utility;

const CUSTOMER_BOOKING_TYPE = "CUSTOMER_BOOKING";
const OWNER_BOOKING_TYPE = "OWNER_BOOKING";

function calculateTotalAmount(input, user) {
	//validate input data
	const schema = Joi.object({
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
		bookingType: Joi
			.string()
			.required()
			.valid(CUSTOMER_BOOKING_TYPE, OWNER_BOOKING_TYPE)
	});
	utility.validateInput(schema, input);

	const startTime = utility.isoStrToDate(input.startTime, 0);
	const endTime = utility.isoStrToDate(input.endTime, 0);

	//startTime cannot be later then endTime
	if (startTime > endTime) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "endTime cannot be earlier then startTime" };
	}
	
	//calculate duration in hours
	const diffTime = Math.abs(endTime - startTime);
	const durationByMinutes = Math.ceil(diffTime / (1000 * 60));
	const durationByHours = Math.round((durationByMinutes / 60) * 2) / 2;

	//calculate regular maount
	const unitPrice = config.get("pricing.unitPriceRegular");
	const regularAmount = durationByHours * unitPrice;

	let discounts = [];

	//check for OWNER discount
	if (input.bookingType === "OWNER_BOOKING") {
		const totalDiscount = config.get("pricing.ownerDiscount") * durationByHours;
		const discount = {
			amount: totalDiscount,
			discountCode: "OWNER_DISCOUNT"
		}

		discounts.push(discount);
	}

	//check for WEEKDAY discount for customer booking
	if (startTime.getDay() != 6 && startTime.getDay() != 0 && input.bookingType=="CUSTOMER_BOOKING") {
		const discount = {
			amount: config.get("pricing.weekdayDiscount"),
			discountCode: "WEEKDAY_DISCOUNT"
		}

		discounts.push(discount);
	}

	//calculate totalAmount
	let totalAmount;
	let totalDiscountAmount = 0;
	discounts.forEach(discount => {
		totalDiscountAmount += discount.amount;
	});

	totalAmount = regularAmount - totalDiscountAmount;

	let pricingObject = new Object();
	pricingObject.regularAmount = regularAmount;

	if (discounts.length > 0) {
		pricingObject.discounts = discounts;
	}

	pricingObject.totalAmount = totalAmount;
	pricingObject.durationByHours = durationByHours;
	pricingObject.unitPrice = unitPrice;
	pricingObject.currency = config.get("pricing.unitCurrency");

	return pricingObject;
}

module.exports = {
    calculateTotalAmount
}
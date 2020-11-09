"use strict";
const mongoose = require("mongoose");
const moment = require("moment");
const Joi = require("joi");

const customError = require("../common/customError")
const userAuthorization = require("../common/middleware/userAuthorization");
const logger = require("../common/logger").logger;
const bookingCommon = require("./booking.common");
const Booking = require("./booking.model").Booking;


const PAID_STATUS = "PAID";
const PARTIAL_PAID_STATUS = "PARTIAL_PAID";
const AWAITING_PAYMENT_STATUS = "AWAITING_PAYMENT";

/**
 * By : Ken Lai
 * Date : July 3, 2020
 * 
 */
async function makePayment(input, user) {
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		amount: Joi
			.number()
			.required(),
		currency: Joi
			.string()
			.valid("HKD","CNY")
			.required(),
		bookingId: Joi
			.string()
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//valid booking id
	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	}

	//find booking
	let booking;
	try {
		booking = await Booking.findById(input.bookingId);
	} catch (err) {
		logger.error("Booking.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//if no booking found, it's a bad bookingId,
	if (booking == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	}

	//Validate currency
	if (input.currency != booking.invoice.currency) {
		throw { name: customError.BAD, message: "Cannot make payment in " + input.currency };
	}

	//add payment to payments array
	if (booking.invoice.payments == null) {
		booking.invoice.payments = [];
	}
	
	const payment = {
		amount: input.amount,
		paymentDate: moment().toDate()
	}

	booking.invoice.payments.push(payment);

	//tally all payment amounts
	let totalPaymentAmount = 0;
	booking.invoice.payments.forEach(payment => {
		totalPaymentAmount += payment.amount;
	});

	//calculate balance
	booking.invoice.balance = calculateBalance(booking.invoice.totalAmount, totalPaymentAmount);

	//set paymentStatus
	let paymentStatus;
	if (totalPaymentAmount == booking.invoice.totalAmount) {
		paymentStatus = PAID_STATUS;
	} else if (totalPaymentAmount < booking.invoice.totalAmount && totalPaymentAmount > 0) {
		paymentStatus = PARTIAL_PAID_STATUS;
	} else if (totalPaymentAmount == 0) {
		paymentStatus = AWAITING_PAYMENT_STATUS;
	}
	booking.invoice.paymentStatus = paymentStatus;

	//add transaction history
	var transactionHistory = new Object();
	transactionHistory.transactionTime = moment().toDate();
	transactionHistory.userId = user.id;
	transactionHistory.userName = user.name;
	transactionHistory.transactionDescription = "Payment made $" + totalPaymentAmount;
	booking.history.push(transactionHistory);

	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save() Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return bookingCommon.bookingToOutputObj(booking);
}

/**
 * By : Ken Lai
 * Date : July 27, 2020
 * 
 */
async function applyDiscount(input, user) {
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		discountAmount: Joi
			.number()
			.required(),
		discountCode: Joi
			.string()
			.valid("WEEKDAY_DISCOUNT", "OWNER_DISCOUNT", "VIP_DISCOUNT")
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate bookingId
	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid bookingId" };
	}

	//find booking
	let booking;
	try {
		booking = await Booking.findById(input.bookingId); 
	} catch (err) {
		logger.error("Booking.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (booking == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	}
	
	//set discounts
	if (booking.invoice.discounts == null) {
		booking.invoice.discounts = new Array();
	}

	const discount = {
		amount: input.discountAmount,
		discountCode: input.discountCode
	}
	booking.invoice.discounts.push(discount);
	
	//calculate totalAmount
	booking.invoice.totalAmount = calculateTotalAmount(booking.invoice.regularAmount, booking.invoice.discounts);
	
	//calculate balance
	booking.invoice.balance = calculateBalance(booking.invoice.totalAmount, booking.invoice.paidAmount);
	
	//add transaction history
	var transactionHistory = new Object();
	transactionHistory.transactionTime = moment().toDate();
	transactionHistory.userId = user.id;
	transactionHistory.userName = user.name;
	transactionHistory.transactionDescription = `Gave ${input.discountCode} (${input.discountAmount})`;
	booking.history.push(transactionHistory);

	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return bookingCommon.bookingToOutputObj(booking);
}

function calculateBalance(totalAmount, paidAmount) {
	return totalAmount - paidAmount;
}

function calculateTotalAmount(regularAmount, discounts) {
	let totalDiscountAmount = 0;

	if (discounts != null) {
		discounts.forEach(discount => {
			totalDiscountAmount += discount.amount;
		});
	}

	return regularAmount - totalDiscountAmount;
}

async function removeDiscount(input, user) {
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP
	]
	
	//validate user
	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		discountId: Joi
			.string()
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//validate bookingId
	if (mongoose.Types.ObjectId.isValid(input.bookingId) == false) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid bookingId" };
	}
	
	//find booking
	let booking;
	try {
		booking = await Booking.findById(input.bookingId);
	} catch (err) {
		logger.error("Booking.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (booking == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };
	}
	
	//find discount
	let targetDiscount;
	if (booking.invoice.discounts != null && booking.invoice.discounts.length > 0) {
		booking.invoice.discounts.forEach((discount, index, object) => {
			if (discount._id == input.discountId) {
				targetDiscount = discount;
				object.splice(index, 1);
			}
		});
	}

	//validate discountId
	if (targetDiscount == null) {
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Discount not found" };
	}

	//calculate totalAmount
	booking.invoice.totalAmount = calculateTotalAmount(booking.invoice.regularAmount, booking.invoice.discounts);

	//calculate balance
	booking.invoice.balance = calculateBalance(booking.invoice.totalAmount, booking.invoice.paidAmount);


	//add transaction history
	if (booking.history == null) {
		booking.history = [];
	}
	booking.history.push({
		transactionTime: moment().toDate(),
		transactionDescription: `Removed discount : ${targetDiscount.discountCode}, ${targetDiscount.amount}`,
		userId: user.id,
		userName: user.name
	});

	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return bookingCommon.bookingToOutputObj(booking);
}

module.exports = {
	makePayment,
	applyDiscount,
	removeDiscount
}


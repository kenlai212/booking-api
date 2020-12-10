"use strict";
const moment = require("moment");
const Joi = require("joi");

const customError = require("../../common/customError");
const logger = require("../../common/logger").logger;
const bookingCommon = require("../booking.common");
const bookingHistoryHelper = require("../bookingHistory_internal.helper");


const PAID_STATUS = "PAID";
const PARTIAL_PAID_STATUS = "PARTIAL_PAID";
const AWAITING_PAYMENT_STATUS = "AWAITING_PAYMENT";

async function makePayment(input, user) {
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

	//get booking
	let booking;
	try{
		booking = await bookingCommon.getBooking(input.bookingId);
	}catch(error){
		throw error;
	}

	//Validate currency
	if (input.currency != booking.invoice.currency) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Payment must be made in " + booking.invoice.currency };
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

	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save() Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//add history item
	const addBookingHistoryItemInput = {
		bookingId: booking._id.toString(),
		transactionTime: moment().utcOffset(0).format("YYYY-MM-DDTHH:mm:ss"),
		utcOffset: 0,
		transactionDescription: `Payment made ${input.currency} ${input.amount}`
	}

	try {
		await bookingHistoryHelper.addHistoryItem(addBookingHistoryItemInput, user);
	} catch (err) {
		logger.error("bookingCommon.addBookingHistoryItem Error", err);
		logger.error(`Made payment to booking(${booking._id.toString()}), but failed to addHistoryItem. Please trigger addHistoryItem manually. ${JSON.stringify(addBookingHistoryItemInput)}`);
	}

	return bookingCommon.bookingToOutputObj(booking);
}

async function applyDiscount(input, user) {
	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		amount: Joi
			.number()
			.required(),
		currency: Joi
			.string()
			.valid("HKD")
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

	//get booking
	let booking;
	try{
		booking = await bookingCommon.getBooking(input.bookingId);
	}catch(error){
		throw error;
	}

	//check currency
	if(booking.invoice.currency != input.currency){
		throw { name: customError.BAD_REQUEST_ERROR, message: `Must apply discount in ${booking.invoice.currency}` };
	}
	
	//set discounts
	if (booking.invoice.discounts == null) {
		booking.invoice.discounts = new Array();
	}

	const discount = {
		amount: input.amount,
		discountCode: input.discountCode
	}
	booking.invoice.discounts.push(discount);
	
	//calculate totalAmount
	booking.invoice.totalAmount = calculateTotalAmount(booking.invoice.regularAmount, booking.invoice.discounts);
	
	//calculate balance
	booking.invoice.balance = calculateBalance(booking.invoice.totalAmount, booking.invoice.paidAmount);

	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//add history item
	const addBookingHistoryItemInput = {
		bookingId: booking._id.toString(),
		transactionTime: moment().utcOffset(0).format("YYYY-MM-DDTHH:mm:ss"),
		utcOffset: 0,
		transactionDescription: `Applied discount ${input.discountCode} ${input.currency} ${input.amount}`
	}

	try {
		await bookingHistoryHelper.addHistoryItem(addBookingHistoryItemInput, user);
	} catch (err) {
		logger.error("bookingCommon.addBookingHistoryItem Error", err);
		logger.error(`Discount applied to booking(${booking._id.toString()}), but failed to addHistoryItem. Please trigger addHistoryItem manually. ${JSON.stringify(addBookingHistoryItemInput)}`);
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

	//get booking
	let booking;
	try{
		booking = await bookingCommon.getBooking(input.bookingId);
	}catch(error){
		throw error;
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

	try {
		booking = await booking.save();
	} catch (err) {
		logger.error("booking.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//add history item
	const addBookingHistoryItemInput = {
		bookingId: booking._id.toString(),
		transactionTime: moment().utcOffset(0).format("YYYY-MM-DDTHH:mm:ss"),
		utcOffset: 0,
		transactionDescription: `Removed discount : ${targetDiscount.discountCode}, ${targetDiscount.amount}`
	}

	try {
		await bookingHistoryHelper.addHistoryItem(addBookingHistoryItemInput, user);
	} catch (err) {
		logger.error("bookingCommon.addBookingHistoryItem Error", err);
		logger.error(`Removed discount from booking(${booking._id.toString()}), but failed to addHistoryItem. Please trigger addHistoryItem manually. ${JSON.stringify(addBookingHistoryItemInput)}`);
	}

	return bookingCommon.bookingToOutputObj(booking);
}

module.exports = {
	makePayment,
	applyDiscount,
	removeDiscount
}


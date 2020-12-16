"use strict";
const moment = require("moment");
const Joi = require("joi");

const utility = require("../../common/utility");
const customError = require("../../common/customError");

const bookingCommon = require("../booking.common");
const PricingHelper = require("../pricing_internal.helper");

const PAID_STATUS = "PAID";
const PARTIAL_PAID_STATUS = "PARTIAL_PAID";
const AWAITING_PAYMENT_STATUS = "AWAITING_PAYMENT";

const CUSTOMER_BOOKING_TYPE = "CUSTOMER_BOOKING";
const OWNER_BOOKING_TYPE = "OWNER_BOOKING";

async function initBookingInvoice(input, user){
	//validate input data
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		startTime: Joi.date().iso().required(),
		endTime: Joi.date().iso().required(),
		utcOffset: Joi.number().min(-12).max(14).required(),
		bookingType: Joi
			.string()
			.valid(CUSTOMER_BOOKING_TYPE, OWNER_BOOKING_TYPE)
			.required()
	});
	utility.validateInput(schema, input);

	//get booking
	let booking = await bookingCommon.getBooking(input.bookingId);

	const totalAmountObj = PricingHelper.calculateTotalAmount(input.startTime, input.endTime, input.utcOffset, booking.bookingType);
	
	let invoice = new Object();
	invoice.regularAmount = totalAmountObj.regularAmount;
	invoice.totalAmount = totalAmountObj.totalAmount;

	if (totalAmountObj.discounts != null && totalAmountObj.discounts.length > 0) {
		invoice.discounts = totalAmountObj.discounts;
	}

	invoice.paidAmount = 0;
	invoice.balance = totalAmountObj.totalAmount;
	invoice.unitPrice = totalAmountObj.unitPrice;
	invoice.currency = totalAmountObj.currency;
	invoice.paymentStatus = AWAITING_PAYMENT_STATUS;

	booking.invoice = invoice

	//update booking record
	const bookingOutput = await bookingCommon.saveBooking(booking);

	//add history item
	bookingCommon.addBookingHistoryItem(bookingOutput.id, `Added invoice ${JSON.stringify(invoice)} to booking(${booking._id.toString()})`, user);

	return bookingOutput;
}

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
	utility.validateInput(schema, input);

	//get booking
	let booking = await bookingCommon.getBooking(input.bookingId);

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

	//update booking record
	const bookingOutput = await bookingCommon.saveBooking(booking);

	//add history item
	bookingCommon.addBookingHistoryItem(bookingOutput.id, `Made payment ${JSON.stringify(payment)} to booking(${booking._id.toString()})`, user);

	return bookingOutput;
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
	utility.validateInput(schema, input);

	//get booking
	let booking = await bookingCommon.getBooking(input.bookingId);

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

	//update booking record
	const bookingOutput = await bookingCommon.saveBooking(booking);

	//add history item
	bookingCommon.addBookingHistoryItem(bookingOutput.id, `Discount ${JSON.stringify(discount)} applied to booking(${booking._id.toString()})`, user);

	return bookingOutput;
}

//private function
function calculateBalance(totalAmount, paidAmount) {
	return totalAmount - paidAmount;
}

//private function
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
	utility.validateInput(schema, input);

	//get booking
	let booking = await bookingCommon.getBooking(input.bookingId);
	
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

	//update booking record
	const bookingOutput = await bookingCommon.saveBooking(booking);

	//add history item
	bookingCommon.addBookingHistoryItem(bookingOutput.id, `Removed discount ${JSON.stringify(targetDiscount)} from booking(${booking._id.toString()})`, user);

	return bookingOutput;
}

module.exports = {
	initBookingInvoice,
	makePayment,
	applyDiscount,
	removeDiscount
}


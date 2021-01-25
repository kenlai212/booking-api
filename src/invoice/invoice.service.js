"use strict";
const moment = require("moment");
const Joi = require("joi");

const utility = require("../common/utility");
const customError = require("../common/customError");

const bookingCommon = require("../booking/booking.common");
const PricingHelper = require("../booking/pricing_internal.helper");
const { Invoice } = require("./invoice.model");

const PAID_STATUS = "PAID";
const PARTIAL_PAID_STATUS = "PARTIAL_PAID";
const AWAITING_PAYMENT_STATUS = "AWAITING_PAYMENT";

const CUSTOMER_BOOKING_TYPE = "CUSTOMER_BOOKING";
const OWNER_BOOKING_TYPE = "OWNER_BOOKING";

async function addNewInvoice(input, user){
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

	let invoice = new Invoice();
	invoice.bookingId = input.bookingId;

	const totalAmountObj = PricingHelper.calculateTotalAmount(input.startTime, input.endTime, input.utcOffset, input.bookingType);
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

	//save invoice record
	try{
		invoice = await invoice.save()
	}catch(error){
		logger.error("invoice.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//add history item
	bookingCommon.addBookingHistoryItem(input.bookingId, `Added invoice ${JSON.stringify(invoice)} to booking(${input.bookingId})`, user);

	return invoiceToOutputObj(invoice);
}

async function findInvoice(input, user){
	//validate input data
	const schema = Joi.object({
		id: Joi
			.number()
			.required()
	});
	utility.validateInput(schema, input);

	let invoice;
	try{
		invoice = await Invoice.findById(input.id);
	}catch(error){
		logger.error("Invoice.findById Error : ", error);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if(!invoice){
		try{
			invoice = await Invoice.findOne({bookingId : input.id});
		}catch(error){
			logger.error("Invoice.findOne Error : ", error);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
		}	
	}

	if(!inovice)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid id" };

	return invoiceToOutputObj(invoice);
}

async function searchInvoice(input, user){
	let invoices;
	try {
		invoices = await Invoice.find();
	} catch (err) {
		logger.error("Invoice.find Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//set outputObjs
	var outputObjs = [];
	invoices.forEach((item) => {
		outputObjs.push(invoiceToOutputObj(item));

	});

	return {
		"count": outputObjs.length,
		"crews": outputObjs
	};
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

	let invoice = await getTargetInvoice(input.bookingId);
	
	//Validate currency
	if (input.currency != invoice.currency) {
		throw { name: customError.BAD_REQUEST_ERROR, message: `Payment must be made in ${invoice.currency}` };
	}

	//add payment to payments array
	if (!invoice.payments)
		invoice.payments = [];
	
	const payment = {
		amount: input.amount,
		paymentDate: moment().toDate()
	}

	invoice.payments.push(payment);

	//tally all payment amounts
	let totalPaymentAmount = 0;
	invoice.payments.forEach(payment => {
		totalPaymentAmount += payment.amount;
	});

	//calculate balance
	invoice.balance = calculateBalance(invoice.totalAmount, totalPaymentAmount);

	//set paymentStatus
	let paymentStatus;
	if (totalPaymentAmount === invoice.totalAmount) {
		paymentStatus = PAID_STATUS;
	} else if (totalPaymentAmount < invoice.totalAmount && totalPaymentAmount > 0) {
		paymentStatus = PARTIAL_PAID_STATUS;
	} else if (totalPaymentAmount === 0) {
		paymentStatus = AWAITING_PAYMENT_STATUS;
	}
	invoice.paymentStatus = paymentStatus;

	//update record
	try{
		invoice = await invoice.save();
	}catch(error){
		logger.error("invoice.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//add history item
	bookingCommon.addBookingHistoryItem(bookingOutput.id, `Made payment ${JSON.stringify(payment)} to booking(${input.bookingId})`, user);

	return invoiceToOutputObj(invoice);
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

	let invoice = await getTargetInvoice(input.bookingId);

	//check currency
	if(invoice.currency != input.currency){
		throw { name: customError.BAD_REQUEST_ERROR, message: `Must apply discount in ${invoice.currency}` };
	}
	
	//set discounts
	if (!invoice.discounts) 
		booking.invoice.discounts = new Array();

	const discount = {
		amount: input.amount,
		discountCode: input.discountCode
	}
	invoice.discounts.push(discount);
	
	//calculate totalAmount
	invoice.totalAmount = calculateTotalAmount(invoice.regularAmount, invoice.discounts);
	
	//calculate balance
	invoice.balance = calculateBalance(invoice.totalAmount, invoice.paidAmount);

	//update record
	try{
		invoice = await invoice.save();
	}catch(error){
		logger.error("invoice.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//add history item
	bookingCommon.addBookingHistoryItem(bookingOutput.id, `Discount ${JSON.stringify(discount)} applied to booking(${booking._id.toString()})`, user);

	return invoiceToOutputObj(invoice);
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

	let invoice = await getTargetInvoice(input.bookingId);
	
	//find discount
	let targetDiscount;
	if (invoice.discounts && invoice.discounts.length > 0) {
		invoice.discounts.forEach((discount, index, object) => {
			if (discount._id == input.discountId) {
				targetDiscount = discount;
				object.splice(index, 1);
			}
		});
	}

	if (!targetDiscount)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Discount not found" };

	//calculate totalAmount
	invoice.totalAmount = calculateTotalAmount(invoice.regularAmount, invoice.discounts);

	//calculate balance
	invoice.balance = calculateBalance(invoice.totalAmount, invoice.paidAmount);

	//update record
	try{
		invoice = await invoice.save();
	}catch(error){
		logger.error("invoice.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	//add history item
	bookingCommon.addBookingHistoryItem(bookingOutput.id, `Removed discount ${JSON.stringify(targetDiscount)} from booking(${booking._id.toString()})`, user);

	return bookingOutput;
}

//private function
async function getTargetInvoice(bookingId){
	if (!mongoose.Types.ObjectId.isValid(bookingId))
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };

	let invoice;
	try {
		invoice = await Invoice.findOne({bookingId: input.bookingId});
	} catch (err) {
		logger.error("Invoice.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
	
	if (!invoice)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };

	return invoice
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

//privaate function
function invoiceToOutputObj(invoice){
	let outputObj = new Object();
	outputObj.regularAmount = invoice.regularAmount;
	outputObj.totalAmount = invoice.totalAmount;
	outputObj.balance = invoice.balance;
	outputObj.currency = invoice.currency;
	outputObj.unitPrice = invoice.unitPrice;
	outputObj.paymentStatus = invoice.paymentStatus;

	if (invoice.discounts && invoice.discounts.length > 0) {
		outputObj.discounts = [];

		invoice.discounts.forEach(discount => {
			outputObj.discounts.push({
				discountId: discount._id.toString(),
				amount: discount.amount,
				discountCode: discount.discountCode
			});
		});
	}

	if (invoice.payments && invoice.payments.length > 0) {
		outputObj.payments = [];

		invoice.payments.forEach(payment => {
			outputObj.payments.push({
				paymentId: payment._id.toString(),
				amount: payment.amount,
				paymentCode: payment.paymentCode
			});
		});
	}

	return outputObj;
}

module.exports = {
	addNewInvoice,
	findInvoice,
	searchInvoice,
	makePayment,
	applyDiscount,
	removeDiscount
}


"use strict";
const moment = require("moment");
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const invoiceHelper = require("./invoice.helper");
const { Invoice } = require("./invoice.model");

const PAID_STATUS = "PAID";
const PARTIAL_PAID_STATUS = "PARTIAL_PAID";
const AWAITING_PAYMENT_STATUS = "AWAITING_PAYMENT";

async function addNewInvoice(input){
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		unit: Joi
			.number()
			.required(),
		unitPrice: Joi
			.number()
			.required(),
		currency: Joi
			.string()
			.valid("HKD")
			.required(),
		discounts: Joi
			.array()
			.items(Joi.object({
				amount: Joi.number(),
				discountCode: Joi.string().valid("WEEKDAY_DISCOUNT","VIP_DISCOUNT")
			}))
	});
	utility.validateInput(schema, input);

	let invoice = new Invoice();
	invoice.bookingId = input.bookingId;
	invoice.unitPrice = input.unitPrice;
	invoice.currency = input.currency;

	invoice.regularAmount = input.unit * input.unitPrice;

	invoice.discounts = input.discounts;
	let totalDiscountAmount = 0;

	if(input.discount){
		input.discount.forEach(discount => {
			totalDiscountAmount += discount.amount;
		});
	}

	invoice.totalAmount = invoice.regularAmount - totalDiscountAmount;
	
	invoice.paidAmount = 0;
	invoice.balance = input.totalAmount;
	invoice.paymentStatus = AWAITING_PAYMENT_STATUS;

	return await invoiceHelper.saveInvoice(invoice);
}

async function makePayment(input) {
	const schema = Joi.object({
		amount: Joi
			.number()
			.required(),
		currency: Joi
			.string()
			.required(),
		bookingId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	invoiceHelper.validateCurrency(input.currency);

	let invoice = await invoiceHelper.getTargetInvoice(input.bookingId);
	
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

	invoice.balance = invoiceHelper.calculateBalance(invoice.totalAmount, totalPaymentAmount);

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

	return await invoiceHelper.saveInvoice(invoice);
}

async function applyDiscount(input) {
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		amount: Joi
			.number()
			.required(),
		currency: Joi
			.string()
			.required(),
		discountCode: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	invoiceHelper.validateDiscountCode(input.discountCode);

	invoiceHelper.validateCurrency(input.currency);

	let invoice = await invoiceHelper.getTargetInvoice(input.bookingId);

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
	
	invoice.totalAmount = invoiceHelper.calculateTotalAmount(invoice.regularAmount, invoice.discounts);
	
	invoice.balance = invoiceHelper.calculateBalance(invoice.totalAmount, invoice.paidAmount);

	try{
		invoice = await invoice.save();
	}catch(error){
		logger.error("invoice.save Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	return invoice;
}

async function removeDiscount(input, user) {
	const schema = Joi.object({
		bookingId: Joi
			.string()
			.required(),
		discountId: Joi
			.string()
			.required()
	});
	utility.validateInput(schema, input);

	let invoice = await invoiceHelper.getTargetInvoice(input.bookingId);
	
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

	invoice.totalAmount = invoiceHelper.calculateTotalAmount(invoice.regularAmount, invoice.discounts);

	invoice.balance = invoiceHelper.calculateBalance(invoice.totalAmount, invoice.paidAmount);

	return invoiceHelper.saveInvoice(invoice);
}

module.exports = {
	addNewInvoice,
	makePayment,
	applyDiscount,
	removeDiscount
}


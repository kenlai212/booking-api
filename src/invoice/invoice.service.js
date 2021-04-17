"use strict";
const moment = require("moment");
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const invoiceHelper = require("./invoice.helper");
const invoiceDomain = require("./invoice.domain");

const PAID_STATUS = "PAID";
const PARTIAL_PAID_STATUS = "PARTIAL_PAID";
const AWAITING_PAYMENT_STATUS = "AWAITING_PAYMENT";

async function newInvoice(input){
	const schema = Joi.object({
		bookingId: Joi.string().required(),
		currency: Joi.string().required(),
		items: Joi.array().items(
            Joi.object({
                itemCode: Joi.string(),
                unit: Joi.number(),
                unitPrice: Joi.number()
            })
        ),
		discounts: Joi.array().items(
			Joi.object({
				amount: Joi.number(),
				discountCode: Joi.string()
			}))
	});
	utility.validateInput(schema, input);

	invoiceHelper.validateCurrency(input.currency);

	let createInvoiceInput;
	createInvoiceInput.bookingId = input.bookingId;
	createInvoiceInput.currency = input.currency;
	createInvoiceInput.status = AWAITING_PAYMENT_STATUS;

	createInvoiceInput.items = [];
	input.items.forEach(item => {
		invoiceHelper.validateItemCode(item.itemCode);
		createInvoiceInput.push(item);
	});

	if(input.discount){
		createInvoiceInput.discounts = [];
		input.discount.forEach(discount => {
			invoiceHelper.validateDiscountCode(discount.discountCode);
			createInvoiceInput.discounts.push(discount);
		});
	}

	return await invoiceDomain.createInvoice(createInvoiceInput);
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

	let invoice = await invoiceDomain.readInvoice(input.bookingId);
	
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

	//set status
	let status;
	if (totalPaymentAmount === invoice.totalAmount) {
		status = PAID_STATUS;
	} else if (totalPaymentAmount < invoice.totalAmount && totalPaymentAmount > 0) {
		status = PARTIAL_PAID_STATUS;
	} else if (totalPaymentAmount === 0) {
		status = AWAITING_PAYMENT_STATUS;
	}
	invoice.paymentStatus = status;

	return await invoiceDomain.updateInvoice(invoice);
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

	let invoice = await invoiceDomain.readInvoice(input.bookingId);

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

	return invoiceDomain.updateInvoice(invoice);
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

	let invoice = await invoiceDomain.readInvoice(input.bookingId);
	
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

	return invoiceDomain.updateInvoice(invoice);
}

module.exports = {
	newInvoice,
	makePayment,
	applyDiscount,
	removeDiscount
}


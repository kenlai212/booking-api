"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const { Invoice } = require("./invoice.model");

async function findInvoice(input, user){
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

async function searchInvoices(input, user){
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
		"invoices": outputObjs
	};
}

function invoiceToOutputObj(invoice){
	let outputObj = new Object();
	outputObj.id = invoice._id;
	outputObj.bookingId = invoice.bookingId;
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
	findInvoice,
	searchInvoices
}
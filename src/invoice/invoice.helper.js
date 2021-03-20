"use strict";
const mongoose = require("mongoose");

const utility = require("../common/utility");
const {logger, customError} = utility;

const { Invoice } = require("./invoice.model");

async function getTargetInvoice(bookingId){
	if (!mongoose.Types.ObjectId.isValid(bookingId))
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };

	let invoice;
	try {
		invoice = await Invoice.findOne({bookingId: input.bookingId});
	} catch (err) {
		logger.error("Invoice.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Invoice Error" };
	}
	
	if (!invoice)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };

	return invoice
}

async function saveInvoice(invoice){
	try{
		invoice = await invoice.save()
	}catch(error){
		logger.error("invoice.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Invoice Error" };
	}

	return invoice;
}

function validateDiscountCode(discountCode){
	const validDiscountCodes = [
		"WEEKDAY_DISCOUNT", 
		"OWNER_DISCOUNT", 
		"VIP_DISCOUNT"
	]

	if(!validateDiscountCodes.includes(discountCode))
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid discountCode" };
}

function validateCurrency(currency){
	const validCurrency = [
		"HKD",
		"CNY"
	]

	if(!validCurrency.includes(currency))
	throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid currency" };
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

module.exports = {
    getTargetInvoice,
	validateDiscountCode,
	validateCurrency,
	saveInvoice,
	calculateBalance,
	calculateTotalAmount
}
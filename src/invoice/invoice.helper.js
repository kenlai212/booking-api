"use strict";
const mongoose = require("mongoose");

const utility = require("../common/utility");
const {customError} = utility;

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
	validateDiscountCode,
	validateCurrency,
	calculateBalance,
	calculateTotalAmount
}
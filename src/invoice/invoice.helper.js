"use strict";
const { Invoice } = require("./invoice.model");

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
	calculateBalance,
	calculateTotalAmount
}
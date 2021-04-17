"use strict";
const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
	bookingId: String,
	items: [{
		itemCode: String,
		unit: Number,
		unitPrice: Number
	}],
	discounts: [{
		amount: Number,
		discountCode: String
	}],
	payments: [{
		amount: Number,
		paymentDate: Date
    }],
	status: String
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = {
	Invoice
}
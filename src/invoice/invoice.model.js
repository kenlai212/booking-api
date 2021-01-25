"use strict";
const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
	bookingId: String,
	unitPrice: Number,
	currency: String,
	regularAmount: Number,
	discounts: [{
		amount: Number,
		discountCode: String
	}],
	totalAmount: Number,
	payments: [{
		amount: Number,
		paymentDate: Date
    }],
	paidAmount: Number,
	balance: Number,
	paymentStatus: String
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = {
	Invoice
}
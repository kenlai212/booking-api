"use strict";
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
	creationTime: Date,
	createdBy: String,
	bookingType: String,
	status: String,
	startTime: Date,
	endTime: Date,
	durationByHours: Number,
	fulfilledHours: Number,
	invoice: {
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
		paymentStatus: String,
	},
	host: {
		hostName: String,
		telephoneCountryCode: String,
		telephoneNumber: String,
		emailAddress: String,
	},
	guests: [{
		guestName: String,
		telephoneCountryCode: String,
		telephoneNumber: String,
		emailAddress: String,
		disclaimerId: String,
		signedDisclaimerTimeStamp: Date
	}],
	crews: [{
		crewId: String,
		crewName: String,
		telephoneCountryCode: String,
		telephoneNumber: String,
		assignmentTime: Date,
		assignmentBy: String
	}]
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = {
	Booking
}
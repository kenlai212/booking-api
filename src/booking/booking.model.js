"use strict";
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
	creationTime: Date,
	createdBy: String,
	bookingType: String,
	occupancyId: String,
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
	}],
	history: [{
		transactionTime: Date,
		transactionDescription: String,
		userId: String,
		userName: String
	}]
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = {
	Booking
}
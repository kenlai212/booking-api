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
	contactName: String,
	telephoneCountryCode: String,
	telephoneNumber: String,
	emailAddress: String,
	totalAmount: Number,
	recievedAmount: Number,
	fulfilledHours: Number,
	currency: String,
	paymentStatus: String,
	guests: [{
		guestName: String,
		telephoneCountryCode: String,
		telephoneNumber: String,
		emailAddress: String
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
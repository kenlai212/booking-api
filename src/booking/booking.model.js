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
	host: {
		customerId: String
	},
	guests: [{
		customerId: String,
		disclaimerId: String,
		signedDisclaimerTimeStamp: Date
	}],
	crews: [{
		crewId: String,
		assignmentTime: Date,
		assignmentBy: String
	}]
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = {
	Booking
}
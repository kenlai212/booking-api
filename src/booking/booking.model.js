"use strict";
const mongoose = require("mongoose");

const guestSchema = new mongoose.Schema({
	_id: String,
	creationTime: Date,
	createdByParty: String, 
	disclaimerId: String,
	signedDisclaimerTimeStamp: Date
});

const crewSchema = new mongoose.Schema({
	_id: String,
	assignmentTime: Date,
	assignmentBy: String
});

const bookingSchema = new mongoose.Schema({
	_id: String, 
	creationTime: Date,
	createdBy: String,
	bookingType: String,
	status: String,
	startTime: Date,
	endTime: Date,
	fulfilledHours: Number,
	host: {
		customerId: String
	},
	guests: [guestSchema],
	crews: [crewSchema]
});

const Booking = mongoose.model("Booking", bookingSchema);
const Guest = mongoose.model("Guest", guestSchema);

module.exports = {
	Booking,
	Guest
}
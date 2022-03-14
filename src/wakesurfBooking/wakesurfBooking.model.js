"use strict";
const mongoose = require("mongoose");

const wakesurfBookingSchema = new mongoose.Schema({
	_id: String,
	creationTime: Date,
	lastUpdateTime: Date,
	occupancyId: String,
	status: String,
	host: {
		personId: String,
		name: String,
		countryCode: String,
		phoneNumber: String
	},
	captainStaffId: String
});

const WakesurfBooking = mongoose.model("WakesurfBooking", wakesurfBookingSchema);

module.exports = {
	WakesurfBooking
}
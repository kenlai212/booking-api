"use strict";
const mongoose = require("mongoose");

const wakesurfBookingSchema = new mongoose.Schema({
	creationTime: Date,
	lastUpdateTime: Date,
	occupancyId: String,
	status: String,
	hostCustomerId: String,
	captainStaffId: String,
	fulfilledHours: Number
});

const WakesurfBooking = mongoose.model("WakesurfBooking", wakesurfBookingSchema);

module.exports = {
	WakesurfBooking
}
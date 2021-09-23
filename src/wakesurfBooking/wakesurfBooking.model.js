"use strict";
const mongoose = require("mongoose");

const wakesurfBookingSchema = new mongoose.Schema({
	_id: String,
	creationTime: Date,
	lastUpdateTime: Date,
	occupancyId: String,
	status: String,
	hostPersonId: String,
	captainStaffId: String
});

const WakesurfBooking = mongoose.model("WakesurfBooking", wakesurfBookingSchema);

module.exports = {
	WakesurfBooking
}
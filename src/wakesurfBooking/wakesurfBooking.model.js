"use strict";
const mongoose = require("mongoose");

const wakesurfBookingSchema = new mongoose.Schema({
	_id: String,
	creationTime: Date,
	lastUpdateTime: Date,
	startTime: Date,
	endTime: Date,
	occupancyId: String,
	status: String,
	host: {
		personId: String,
		name: String,
		countryCode: String,
		phoneNumber: String
	},
	captain: {
		staffId: String
	},
	asset:{
		assetId: String
	},
	quote:{
		price: Number,
		currency: String
	}
});

const WakesurfBooking = mongoose.model("WakesurfBooking", wakesurfBookingSchema);

module.exports = {
	WakesurfBooking
}
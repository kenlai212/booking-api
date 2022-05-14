"use strict";
const mongoose = require("mongoose");

const wakesurfBookingSchema = new mongoose.Schema({
	_id: String,
	creationTime: Date,
	lastUpdateTime: Date,
	startTime: Date,
	endTime: Date,
	status: String,
	channelId: String,
	host: {
		personId: String,
		name: String,
		countryCode: String,
		phoneNumber: String
	},
	captain: {
		staffId: String
	},
	crew:[{
		staffId: String
	}],
	asset:{
		assetId: String
	},
	quote:{
		price: Number,
		currency: String
	},
	fulfillment:{
		startTime: Date,
		endTime: Date
	}
});

const WakesurfBooking = mongoose.model("WakesurfBooking", wakesurfBookingSchema);

module.exports = {
	WakesurfBooking
}
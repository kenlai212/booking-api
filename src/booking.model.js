"use strict";
const logger = require("./logger");

const mongoose = require("mongoose");

require('dotenv').config();

const bookingSchema = new mongoose.Schema({
	creationTime: Date,
	createdBy: String,
	occupancyId: String,
	status: String,
	startTime: Date,
	endTime: Date,
	contactName: String,
	telephoneCountryCode: String,
	telephoneNumber: String,
	emailAddress: String,
	totalAmount: Number,
	currency: String,
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = {
	Booking
}
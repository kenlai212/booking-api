"use strict";
const logger = require("./logger");

const mongoose = require("mongoose");

require('dotenv').config();

const bookingHistorySchema = new mongoose.Schema({
	status: String,
	startTime: Date,
	endTime: Date,
	contactName: String,
	telephoneCountryCode: String,
	telephoneNumber: String,
	emailAddress: String
});

const BookingHistory = mongoose.model("BookingHistory", bookingHistorySchema);

module.exports = {
	BookingHistory
}
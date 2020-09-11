"use strict";
const mongoose = require("mongoose");


const bookingHistorySchema = new mongoose.Schema({
	bookingId: String,
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
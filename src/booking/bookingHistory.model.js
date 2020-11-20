"use strict";
const mongoose = require("mongoose");


const bookingHistorySchema = new mongoose.Schema({
	bookinId: String,
	history: [{
		transactionTime: Date,
		transactionDescription: String,
		userId: String,
		userName: String
	}]
});

const BookingHistory = mongoose.model("BookingHistory", bookingHistorySchema);

module.exports = {
	BookingHistory
}

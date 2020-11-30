"use strict";
const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
	crewId: String,
	bookings: [{
		bookingId: String,
		startTime: Date,
		endTime: Date
	}]
});

const Assignment = mongoose.model("Assignment", assignmentSchema);

module.exports = {
	Assignment
}
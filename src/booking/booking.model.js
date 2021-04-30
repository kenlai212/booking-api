"use strict";
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({ 
	creationTime: Date,
	createdBy: String,
	occupancyId: String,
	startTime: Date,
	endTime: Date,
	bookingType: String,
	status: String,
	fulfilledHours: Number
});

const occupancySchema = new mongoose.Schema({
	occupancyId: String,
	startTime: Date,
	endTime: Date,
	assetId: String,
	status: String,
	referenceType: String,
	referenceId: String
});

const Booking = mongoose.model("Booking", bookingSchema);
const Occupancy = mongoose.model("BookingOccupancy", occupancySchema);

module.exports = {
	Booking,
	Occupancy
}
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
	fulfilledHours: Number,
	hostCustomerId: String
});

const bookingOccupancySchema = new mongoose.Schema({
	occupancyId: String,
	startTime: Date,
	endTime: Date,
	assetId: String
});

const Booking = mongoose.model("Booking", bookingSchema);
const Occupancy = mongoose.model("BookingOccupancy", bookingOccupancySchema);

module.exports = {
	Booking,
	Occupancy
}
"use strict";
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({ 
	creationTime: Date,
	createdBy: String,
	occupancyId: String,
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

const BookingOccupancy = mongoose.model("Occupancy", bookingOccupancySchema);
const Booking = mongoose.model("Booking", bookingSchema);

module.exports = {
	Booking,
	BookingOccupancy
}
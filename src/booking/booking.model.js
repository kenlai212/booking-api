"use strict";
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({ 
	creationTime: Date,
	requestorId: String,
	occupancyId: String,
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

const customerSchema = new mongoose.Schema({
	customerId: String
});

const Booking = mongoose.model("Booking", bookingSchema);
const Occupancy = mongoose.model("BookingOccupancy", occupancySchema);
const Customer = mongoose.model("BookingCustomer", customerSchema);

module.exports = {
	Booking,
	Occupancy,
	Customer
}
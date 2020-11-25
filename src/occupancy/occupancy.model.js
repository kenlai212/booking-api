"use strict";
const mongoose = require("mongoose");

const occupancySchema = new mongoose.Schema({
	bookingId: String,
	bookingType: String,
	startTime: Date,
	endTime: Date,
	assetId: String
});

const Occupancy = mongoose.model("Occupancy", occupancySchema);

module.exports = {
	Occupancy
}
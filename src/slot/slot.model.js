"use strict";
const mongoose = require("mongoose");

const occupancySchema = new mongoose.Schema({
	occupancyId: String,
	bookingType: String,
	startTime: Date,
	endTime: Date,
	assetId: String
});

const Occupancy = mongoose.model("SlotOccupancy", occupancySchema);

module.exports = {
	Occupancy
}
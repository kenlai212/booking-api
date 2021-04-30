"use strict";
const mongoose = require("mongoose");

const occupancySchema = new mongoose.Schema({
	occupancyId: String,
	startTime: Date,
	endTime: Date,
	assetId: String,
	status: String,
	referenceType: String,
	referenceId: String
});

const Occupancy = mongoose.model("SlotOccupancy", occupancySchema);

module.exports = {
	Occupancy
}
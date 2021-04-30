"use strict";
const mongoose = require("mongoose");

const occupancySchema = new mongoose.Schema({
	referenceType: String,
	referenceId: String,
	startTime: Date,
	endTime: Date,
	assetId: String,
	status: String
});

const Occupancy = mongoose.model("Occupancy", occupancySchema);

module.exports = {
	Occupancy
}
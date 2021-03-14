"use strict";
const mongoose = require("mongoose");

const slotOccupancySchema = new mongoose.Schema({
	occupancyId: String,
	bookingType: String,
	startTime: Date,
	endTime: Date,
	assetId: String
});

const SlotOccupancy = mongoose.model("SlotOccupancy", slotOccupancySchema);

module.exports = {
	SlotOccupancy
}
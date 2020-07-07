"use strict";
const mongoose = require("mongoose");

const occupancySchema = new mongoose.Schema({
	occupancyType: String,
	startTime: Date,
	endTime: Date,
	assetId: String,
	createdBy: String,
	createdTime: Date,
	history: [{
		transactionTime: Date,
		transactionDescription: String,
		userId: String,
		userName: String
	}]
});

const Occupancy = mongoose.model("Occupancy", occupancySchema);

module.exports = {
	Occupancy
}
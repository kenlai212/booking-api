"use strict";
const mongoose = require("mongoose");

const boatSchema = new mongoose.Schema({
	lastUpdateTime: Date,
	assetId: String,
	boatName: String,
	fuelLevel: Number
});

const Boat = mongoose.model("Boat", boatSchema);

module.exports = {
	Boat
}

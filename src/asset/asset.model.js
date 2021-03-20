"use strict";
const mongoose = require("mongoose");

const boatSchema = new mongoose.Schema({
	lastUpdateTime: Date,
	assetId: String,
	boatName: String,
	fuelLevel: Number
});

const fuelReserviorSchema = new mongoose.Schema({
	assetId: String,
	lastUpdateTime: Date,
	lastUpdateBy: String,
	fullCanisters: Number,
	emptyCanisters: Number
});

const FuelReservior = mongoose.model("FuelReservior", fuelReserviorSchema);
const Boat = mongoose.model("Boat", boatSchema);

module.exports = {
	Boat,
    FuelReservior
}
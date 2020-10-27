"use strict";
const mongoose = require("mongoose");

const fuelReserviorSchema = new mongoose.Schema({
	assetId: string,
	lastUpdateTime: Date,
	fullCanister: number,
	emptyCanister: number
});

const FuelReservior = mongoose.model("FuelReservior", fuelReserviorSchema);

module.exports = {
	FuelReservior
}

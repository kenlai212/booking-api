const mongoose = require("mongoose");

const fuelReserviorSchema = new mongoose.Schema({
	assetId: String,
	lastUpdateTime: Date,
	fullCanister: Number,
	emptyCanister: Number
});

const FuelReservior = mongoose.model("FuelReservior", fuelReserviorSchema);

module.exports = {
	FuelReservior
}

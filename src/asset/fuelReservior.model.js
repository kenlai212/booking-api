const mongoose = require("mongoose");

const fuelReserviorSchema = new mongoose.Schema({
	assetId: String,
	lastUpdateTime: Date,
	lastUpdateBy: String,
	fullCanisters: Number,
	emptyCanisters: Number
});

const FuelReservior = mongoose.model("FuelReservior", fuelReserviorSchema);

module.exports = {
	FuelReservior
}

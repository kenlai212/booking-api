"use strict";
const mongoose = require("mongoose");

const occupancySchema = new mongoose.Schema({
	_id: String,
    status: String,
    referenceType: String,
    referenceId: String,
});

const Occupancy = mongoose.model("Occupancy", occupancySchema);

module.exports = {
	Occupancy
}
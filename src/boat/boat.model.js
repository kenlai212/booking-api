"use strict";
const mongoose = require("mongoose");

const boatSchema = new mongoose.Schema({
	boatId: String
});

const Boat = mongoose.model("Boat", boatSchema);

module.exports = {
	Boat
}
"use strict";
const mongoose = require("mongoose");

const disclaimerSchema = new mongoose.Schema({
	creationTime: Date,
	bookingId: String,
	guestId: String,
	telephoneCountryCode: String,
	telephoneNumber: String,
	status: String
});

const Disclaimer = mongoose.model("Disclaimer", disclaimerSchema);

module.exports = {
	Disclaimer
}
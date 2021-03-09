"use strict";
const mongoose = require("mongoose");

const guestSchema = new mongoose.Schema({
	customerId: String,
	partyId: String
});

const manifestSchema = new mongoose.Schema({
	bookingId: String, 
	guests: [{
		customerId: String,
		creationTime: Date,
		createdByParty: String,
		disclaimerId: String,
		signedDisclaimerTimeStamp: Date
	}]
});

const Manifest = mongoose.model("Manifest", manifestSchema);
const Guest = mongoose.model("Guest", guestSchema);

module.exports = {
	Manifest,
	Guest
}
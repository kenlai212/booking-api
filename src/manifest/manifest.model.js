"use strict";
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
	customerId: String,
	personId: String,
	name: String,
	gender: String,
	phoneNumber: String,
	countryCode: String,
	emailAddress: String,
	profilePictureUrl: String
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
const Customer = mongoose.model("ManifestCustomer", customerSchema);

module.exports = {
	Manifest,
	Customer
}
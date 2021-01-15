"use strict";
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
	partyId: String,
	status: String,
	personalInfo: {
		name: String,
		dob: Date,
		gender: String
	},
	contact: {
		telephoneCountryCode: String,
		telephoneNumber: String,
		emailAddress: String
	},
	picture: {
		url: String
	}
});

const Customer = mongoose.model("Customer", customerSchema);

module.exports = {
	Customer
}
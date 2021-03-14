"use strict";
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
	personId: String,
	status: String
});

const customerPersonSchema = new mongoose.Schema({
	personId: String,
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
const CustomerPerson = mongoose.model("CustomerPerson", customerPersonSchema);

module.exports = {
	Customer,
	CustomerPerson
}
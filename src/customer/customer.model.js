"use strict";
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
	personId: String,
	status: String
});

const customerPersonSchema = new mongoose.Schema({
	personId: String,
	name: String,
	dob: Date,
	gender: String,
	phoneNumber: String,
	countryCode: String,
	emailAddress: String,
	profilePictureUrl: String
});

const newCustomerRequestSchema = new mongoose.Schema({
	requestTime: Date,
	requestedBy: String,
	status: String,
	name: String,
	dob: Date,
	gender: String,
	phoneNumber: String,
	countryCode: String,
	emailAddress: String,
	customerId: String,
	personId: String,
	eventPublishedTime: Date
});

const Customer = mongoose.model("Customer", customerSchema);
const CustomerPerson = mongoose.model("CustomerPerson", customerPersonSchema);
const NewCustomerRequest = mongoose.model("NewCustomerRequest", newCustomerRequestSchema);

module.exports = {
	Customer,
	CustomerPerson,
	NewCustomerRequest
}
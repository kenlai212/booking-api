"use strict";
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
	personId: String,
	status: String
});

const personSchema = new mongoose.Schema({
	personId: String,
	name: String,
	dob: Date,
	gender: String,
	phoneNumber: String,
	countryCode: String,
	emailAddress: String,
	profilePictureUrl: String
});

const newPersonRequestSchema = new mongoose.Schema({
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
const Person = mongoose.model("CustomerPerson", personSchema);
const NewPersonRequest = mongoose.model("NewPersonRequest", newPersonRequestSchema);

module.exports = {
	Customer,
	Person,
	NewPersonRequest
}
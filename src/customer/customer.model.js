"use strict";
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
	creationTime: Date,
	lastUpdateTime: Date,
	requestorId: String,
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

const Customer = mongoose.model("Customer", customerSchema);
const Person = mongoose.model("CustomerPerson", personSchema);

module.exports = {
	Customer,
	Person
}
"use strict";
const mongoose = require("mongoose");

const personSchema = new mongoose.Schema({
	creationTime: Date,
	requestorId: String,
	lastUpdateTime: Date,
	name: String,
	dob: Date,
	gender: String,
	countryCode: String,
	phoneNumber: String,
	emailAddresses: String,
	profilePictureUrl: String,
	roles: [String],
	userId: String,
	preferredContactMethod: String,
	preferredLanguage:String
});

const Person = mongoose.model("Person", personSchema);

module.exports = {
	Person
}
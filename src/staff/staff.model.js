"use strict";
const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
	personId: String,
	status: String
});

const PersonSchema = new mongoose.Schema({
	personId: String,
	name: String,
	dob: Date,
	gender: String,
	phoneNumber: String,
	countryCode: String,
	emailAddress: String,
	profilePictureUrl: String
});

const Staff = mongoose.model("Staff", staffSchema);
const Person = mongoose.model("StaffPerson", PersonSchema);

module.exports = {
	Staff,
	Person
}
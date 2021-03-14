"use strict";
const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
	personId: String,
	status: String
});

const staffPersonSchema = new mongoose.Schema({
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

const Staff = mongoose.model("Staff", staffSchema);
const StaffPerson = mongoose.model("StaffPerson", staffPersonSchema);

module.exports = {
	Staff,
	StaffPerson
}
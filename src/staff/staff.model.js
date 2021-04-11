"use strict";
const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
	personId: String,
	status: String
});

const staffPersonSchema = new mongoose.Schema({
	personId: String,
	name: String,
	countryCode: String,
	phoneNumber: String,
	emailAddresses: String,
	profilePictureUrl: String,
});

const Staff = mongoose.model("Staff", staffSchema);
const StaffPerson = mongoose.model("StaffPerson", staffPersonSchema);

module.exports = {
	Staff,
	StaffPerson
}
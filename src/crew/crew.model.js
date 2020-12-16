"use strict";
const mongoose = require("mongoose");

const crewSchema = new mongoose.Schema({
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

const Crew = mongoose.model("Crew", crewSchema);

module.exports = {
	Crew
}

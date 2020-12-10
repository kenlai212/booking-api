"use strict";
const mongoose = require("mongoose");

const crewSchema = new mongoose.Schema({
	name: String,
	partyId: String,
	status: String,
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

"use strict";
const mongoose = require("mongoose");

const crewSchema = new mongoose.Schema({
	crewName: String,
	status: String,
	telephoneCountryCode: String,
	telephoneNumber: String,
	emailAddress: String,
	createdBy: String,
	createdTime: Date,
	history: [{
		transactionTime: Date,
		transactionDescription: String,
		userId: String,
		userName: String
	}]
});

const Crew = mongoose.model("Crew", crewSchema);

module.exports = {
	Crew
}

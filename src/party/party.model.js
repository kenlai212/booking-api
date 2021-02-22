"use strict";
const mongoose = require("mongoose");

const partySchema = new mongoose.Schema({
	creationTime: Date,
	lastUpdateTime: Date,
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
	},
	roles: [String],
	userId: String,
	preferredContactMethod: String,
	preferredLanguage:String
});

const Party = mongoose.model("Party", partySchema);

module.exports = {
	Party
}
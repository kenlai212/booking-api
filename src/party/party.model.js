"use strict";
const { string } = require("joi");
const mongoose = require("mongoose");

const partySchema = new mongoose.Schema({
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

const Party = mongoose.model("Party", partySchema);

module.exports = {
	Party
}
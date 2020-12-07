"use strict";
const mongoose = require("mongoose");

const partySchema = new mongoose.Schema({
	name: String,
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
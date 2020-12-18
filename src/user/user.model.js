"use strict";
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	userType: String,
	provider: String,
	providerUserId: String,
	partyId: String,
	status: String,
	registrationTime: Date,
	activationKey: String,
	resetPasswordKey: String,
	groups: [{ type: String }],
	lastLoginTime: Date,
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

const User = mongoose.model("User", userSchema);

module.exports = {
	User
}
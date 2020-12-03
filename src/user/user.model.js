"use strict";
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	userType: String,
	provider: String,
	providerUserId: String,
	image: String,
	telephoneCountryCode: String,
	telephoneNumber: String,
	emailAddress: String,
	status: String,
	registrationTime: Date,
	activationKey: String,
	resetPasswordKey: String,
	name: String,
	groups: [{ type: String }],
	lastLoginTime: Date
});

const User = mongoose.model("User", userSchema);

module.exports = {
	User
}
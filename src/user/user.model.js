"use strict";
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	userType: String,
	provider: String,
	providerUserId: String,
	personId: String,
	status: String,
	registrationTime: Date,
	activationKey: String,
	groups: [{ type: String }],
	lastLoginTime: Date
});

const personSchema = new mongoose.Schema({
	personId: String,
	name: String,
	dob: Date,
	gender: String,
	countryCode: String,
	phoneNumber: String,
	emailAddresses: String,
	profilePictureUrl: String,
	roles: [String],
});

const User = mongoose.model("User", userSchema);
const Person = mongoose.model("UserPerson", personSchema);

module.exports = {
	User,
	Person
}
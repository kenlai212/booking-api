"use strict";
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	provider: String,
	providerUserId: String,
	personId: String,
	status: String,
	registrationTime: Date,
	activationKey: String,
	groups: [{ type: String }]
});

const personSchema = new mongoose.Schema({
	personId: String,
	roles: [String],
});

const User = mongoose.model("User", userSchema);
const Person = mongoose.model("UserPerson", personSchema);

module.exports = {
	User,
	Person
}
"use strict";
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	userType: String,
	provider: String,
	providerUserId: String,
	image: String,
	telephoneCountryCode: String,
	telephoneNumber:String,
	emailAddress: String,
	status: String,
	registrationTime: Date,
	activationKey: String,
	password: String,
	resetPasswordKey: String,
	lastUpdateTime: Date,
	name: String,
	groups: [{ type : String }],
	history: [{
		transactionTime: Date,
		transactionDescription: String,
		userId: String,
		userName: String
	}]
});

const User = mongoose.model("User", userSchema);

module.exports = {
	User
}
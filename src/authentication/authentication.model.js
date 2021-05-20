"use strict";
const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema({
	userId: String,
	personId: String,
	userStatus: String,
	groups: [{ type: String }],
	roles: [{ type: String }]
});

const credentialsSchema = new mongoose.Schema({
	userId: String,
	provider: String,
	providerUserId: String,
	loginId: String,
	password: String
});

const Claim = mongoose.model("Claim", claimSchema);
const Credentials = mongoose.model("credentials", credentialsSchema);

module.exports = {
	Claim,
	Credentials
}
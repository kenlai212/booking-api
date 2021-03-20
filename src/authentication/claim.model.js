"use strict";
const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema({
	userId: String,
	personId: String,
	provider: String,
	providerUserId: String,
	userStatus: String,
	groups: [{ type: String }]
});

const Claim = mongoose.model("Claim", claimSchema);

module.exports = {
	Claim
}
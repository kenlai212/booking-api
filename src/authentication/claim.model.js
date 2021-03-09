"use strict";
const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema({
	userId: String,
	partyId: String,
	provider: String,
	providerUserId: String,
	userStatus: String
});

const Claim = mongoose.model("Claim", claimSchema);

module.exports = {
	Claim
}
"use strict";
const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
	id: String,
	tokenStr: String,
	issueTime: Date,
	userId: String
});

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

module.exports = {
	RefreshToken
}
"use strict";
const mongoose = require("mongoose");

const credentialsSchema = new mongoose.Schema({
	userId: String,
	loginId: String,
	hashedPassword: String,
	createdTime: Date
});

const Credentials = mongoose.model("credentials", credentialsSchema);

module.exports = {
	Credentials
}

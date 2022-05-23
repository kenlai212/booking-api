"use strict";
const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
	_id: String,
	status: String,
	name: String,
	phoneNumber: String,
	countryCode: String
});

const Staff = mongoose.model("Staff", staffSchema);

module.exports = {
	Staff
}
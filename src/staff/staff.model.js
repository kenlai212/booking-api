"use strict";
const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
	_id: String
});

const Staff = mongoose.model("Staff", staffSchema);

module.exports = {
	Staff
}
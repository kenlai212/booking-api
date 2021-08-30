"use strict";
const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
	staffId: String
});

const Staff = mongoose.model("Staff", staffSchema);

module.exports = {
	Customer: Staff
}
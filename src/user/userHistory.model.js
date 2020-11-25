"use strict";
const mongoose = require("mongoose");

const userHistorySchema = new mongoose.Schema({
	userId: String,
	history: [{
		transactionTime: Date,
		transactionDescription: String,
		userId: String,
		userName: String
	}]
});

const UserHistory = mongoose.model("UserHistory", userHistorySchema);

module.exports = {
	UserHistory
}
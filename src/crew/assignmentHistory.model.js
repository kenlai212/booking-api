"use strict";
const mongoose = require("mongoose");

const assignmentHistorySchema = new mongoose.Schema({
	crewId: String,
	assignments: [{
		itemId: String,
		assignmentType: String,
		startTime: Date,
		endTime: Date
	}]
});

const AssignmentHistory = mongoose.model("AssignmentHistory", assignmentHistorySchema);

module.exports = {
	AssignmentHistory
}
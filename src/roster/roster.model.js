"use strict";
const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
	staffId: String,
	assignments: [{
		bookingId: String,
		startTime: Date,
		endTime: Date
	}]
});

const rosterSchema = new mongoose.Schema({
	bookingId: String, 
	crew: [{
		staffId: String,
		assignmentTime: Date,
		assignByParty: String
	}]
});

const Staff = mongoose.model("RosterStaff", staffSchema);
const Roster = mongoose.model("Roster", rosterSchema);

module.exports = {
	Staff,
	Roster
}
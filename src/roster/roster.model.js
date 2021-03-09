"use strict";
const mongoose = require("mongoose");

const crewMemberSchema = new mongoose.Schema({
	staffId: String,
	partyId: String,
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

const CrewMember = mongoose.model("Crew", crewMemberSchema);
const Roster = mongoose.model("Roster", rosterSchema);

module.exports = {
	CrewMember,
	Roster
}
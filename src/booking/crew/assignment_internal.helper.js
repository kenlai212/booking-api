"use strict";
const moment = require("moment");

const logger = require("../../common/logger").logger;
const assignmentHistoryService = require("../../crew/assignmentHistory.service");

async function addAssignment(input, user) {
	let addAssignmentInput = new Object();

	addAssignmentInput.crewId = input.crewId;
	addAssignmentInput.itemId = input.bookingId;
	addAssignmentInput.assignmentType = "BOOKING";

	addAssignmentInput.startTime = moment(input.startTime).format("YYYY-MM-DDTHH:mm:ssZ");
	addAssignmentInput.endTime = moment(input.endTime).format("YYYY-MM-DDTHH:mm:ssZ");
	addAssignmentInput.utcOffset = 0;
	
	try {
		return await assignmentHistoryService.addAssignment(addAssignmentInput, user);
	} catch (err) {
		logger.error("Error while calling assignmentHistoryService.addAssignment : ", err);
		throw err;
	}
}

async function removeAssignment(crewId, bookingId, user) {
	let input = new Object();

	input.crewId = crewId;
	input.itemId = bookingId;
	input.assignmentType = "BOOKING";

	try {
		return await assignmentHistoryService.removeAssignment(input, user);
	} catch (err) {
		logger.error("Error while calling assignmentHistoryService.removeAssignment : ", err);
		throw err;
	}
}

module.exports = {
	addAssignment,
	removeAssignment
}
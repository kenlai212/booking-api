"use strict";
const moment = require("moment");

const logger = require("../../common/logger").logger;
const assignmentHistoryService = require("../../crew/assignmentHistory.service");

async function addAssignment(crewId, bookingId, startTime, endTime, user) {
	let input = new Object();

	input.crewId = crewId;
	input.itemId = bookingId;
	input.assignmentType = "BOOKING";

	input.startTime = moment(startTime).format("YYYY-MM-DDTHH:mm:ssZ");
	input.endTime = moment(endTime).format("YYYY-MM-DDTHH:mm:ssZ");
	input.utcOffset = 0;
	
	try {
		return await assignmentHistoryService.addAssignment(input, user);
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
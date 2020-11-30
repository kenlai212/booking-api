"use strict";
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const assignmentService = require("./assignment.service");
const userAuthorization = require("../common/middleware/userAuthorization");

const CREW_ADMIN_GROUP = "CREW_ADMIN";

const initAssignment = asyncMiddleware(async (req) => {
	const rightsGroup = [
		CREW_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await assignmentService.initAssignment(req.body, req.user);
});

const addAssignmentItem = asyncMiddleware(async (req) => {
	const rightsGroup = [
		CREW_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await assignmentService.addAssignmentItem(req.body, req.user);
});

module.exports = {
	initAssignment,
	addAssignmentItem
}
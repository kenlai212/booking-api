"use strict";
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const assignmentHistoryService = require("./assignmentHistory.service");
const utility = require("../common/utility");

const CREW_ADMIN_GROUP = "CREW_ADMIN";

const initAssignmentHistory = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [CREW_ADMIN_GROUP]);

	return await assignmentHistoryService.initAssignmentHistory(req.body, req.user);
});

const addAssignment = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [CREW_ADMIN_GROUP]);

	return await assignmentHistoryService.addAssignment(req.body, req.user);
});

const getAssignmentHistory = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [CREW_ADMIN_GROUP]);

	return await assignmentHistoryService.getAssignmentHistory(req.params, req.user);
});

const deleteAssignmentHistory = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [CREW_ADMIN_GROUP]);

	return await assignmentHistoryService.deleteAssignmentHistory(req.params, req.user);
});

const removeAssignment = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [CREW_ADMIN_GROUP]);

	return await assignmentHistoryService.removeAssignment(req.params, req.user);
});

module.exports = {
	initAssignmentHistory,
	addAssignment,
	removeAssignment,
	getAssignmentHistory,
	deleteAssignmentHistory
}
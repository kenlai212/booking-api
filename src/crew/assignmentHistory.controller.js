"use strict";
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const assignmentHistoryService = require("./assignmentHistory.service");
const userAuthorization = require("../common/middleware/userAuthorization");

const CREW_ADMIN_GROUP = "CREW_ADMIN";

const initAssignmentHistory = asyncMiddleware(async (req) => {
	const rightsGroup = [
		CREW_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await assignmentHistoryService.initAssignmentHistory(req.body, req.user);
});

const addAssignment = asyncMiddleware(async (req) => {
	//validate user
	const rightsGroup = [
		CREW_ADMIN_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await assignmentHistoryService.addAssignment(req.body, req.user);
});

const getAssignmentHistory = asyncMiddleware(async (req) => {
	//validate user
	const rightsGroup = [
		CREW_ADMIN_GROUP
	]
	
	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await assignmentHistoryService.getAssignmentHistory(req.params, req.user);
});

const deleteAssignmentHistory = asyncMiddleware(async (req) => {
	//validate user
	const rightsGroup = [
		CREW_ADMIN_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await assignmentHistoryService.deleteAssignmentHistory(req.params, req.user);
});

const removeAssignment = asyncMiddleware(async (req) => {
	//validate user
	const rightsGroup = [
		CREW_ADMIN_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await assignmentHistoryService.removeAssignment(req.params, req.user);
});

module.exports = {
	initAssignmentHistory,
	addAssignment,
	removeAssignment,
	getAssignmentHistory,
	deleteAssignmentHistory
}
"use strict";
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const adminService = require("./admin.service");

const searchUsers = asyncMiddleware(async (req) => {
	return await adminService.searchUsers(req.user);
});

const assignGroup = asyncMiddleware(async (req) => {
	return await adminService.assignGroup(req.body, req.user);
});

const unassignGroup = asyncMiddleware(async (req) => {
	return await adminService.unassignGroup(req.body, req.user);
});

const deactivate = asyncMiddleware(async (req) => {
	return await adminService.deactivateUser(req.body, req.user);
});

const adminActivate = asyncMiddleware(async (req) => {
	return await adminService.adminActivateUser(req.body, req.user);
});

const deleteUser = asyncMiddleware(async (req) => {
	return await adminService.deleteUser(req.body, req.user);
});

const resendActivationEmail = asyncMiddleware(async (req) => {
	return await adminService.resendActivationEmail(req.body, req.user);
});

const searchGroups = asyncMiddleware(async (req) => {
	return await adminService.searchGroups(req.body, req.user);
});

module.exports = {
	searchUsers,
	assignGroup,
	unassignGroup,
	deactivate,
	deleteUser,
	adminActivate,
	resendActivationEmail,
	searchGroups
}
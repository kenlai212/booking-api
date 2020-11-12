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
	return await adminService.unassignGroup(req.params, req.user);
});

const editStatus = asyncMiddleware(async (req) => {
	return await adminService.editStatus(req.body, req.user);
});

const deleteUser = asyncMiddleware(async (req) => {
	return await adminService.deleteUser(req.params, req.user);
});

const resendActivationEmail = asyncMiddleware(async (req) => {
	return await adminService.resendActivationEmail(req.body, req.user);
});

const searchGroups = asyncMiddleware(async (req) => {
	return await adminService.searchGroups(req.body, req.user);
});

module.exports = {
	searchUsers,
	deleteUser,
	assignGroup,
	unassignGroup,
	editStatus,
	resendActivationEmail,
	searchGroups
}
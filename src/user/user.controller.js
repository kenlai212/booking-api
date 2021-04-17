"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const userService = require("./user.service");
const userRead = require("./user.read");

const USER_ADMIN_GROUP = "USER_ADMIN";

const findUser = asyncMiddleware(async (req) => {
	return await userService.findUser(req.params);
});

const findSocialUser = asyncMiddleware(async (req) => {
	const queryObject = url.parse(req.url, true).query;
	return await userService.findSocialUser(queryObject);
});

const activate = asyncMiddleware(async (req) => {
	return await userService.activate(req.body);
});

const updateLastLogin = asyncMiddleware(async (req) => {
	return await userService.updateLastLogin(req.body, req.user);
});

const searchUsers = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [USER_ADMIN_GROUP]);

	return await userRead.searchUsers(req.user);
});

const assignGroup = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [USER_ADMIN_GROUP]);

	return await adminService.assignGroup(req.body, req.user);
});

const unassignGroup = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [USER_ADMIN_GROUP]);

	return await adminService.unassignGroup(req.params, req.user);
});

const deleteUser = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [USER_ADMIN_GROUP]);

	return await adminService.deleteUser(req.params, req.user);
});

const resendActivationEmail = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [USER_ADMIN_GROUP]);

	return await adminService.resendActivationEmail(req.body, req.user);
});

const searchGroups = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [USER_ADMIN_GROUP]);

	return await adminService.searchGroups(req.body, req.user);
});


module.exports = {
	findUser,
	findSocialUser,
	activate,
	updateLastLogin,
	searchUsers,
	assignGroup,
	unassignGroup,
	deleteUser,
	resendActivationEmail,
	searchGroups
}

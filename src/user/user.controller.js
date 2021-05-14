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
	return await userService.updateLastLogin(req.body);
});

const searchUsers = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [USER_ADMIN_GROUP]);

	return await userRead.searchUsers(req.params);
});

const assignGroup = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [USER_ADMIN_GROUP]);

	return await userService.assignGroup(req.body);
});

const unassignGroup = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [USER_ADMIN_GROUP]);

	return await userService.unassignGroup(req.params);
});

const deleteUser = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [USER_ADMIN_GROUP]);

	return await userService.deleteUser(req.params);
});

const resendActivationEmail = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [USER_ADMIN_GROUP]);

	return await userService.resendActivationEmail(req.body);
});

const searchGroups = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [USER_ADMIN_GROUP]);

	return await userService.searchGroups(req.body);
});

const deleteAllUsers = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [USER_ADMIN_GROUP]);

	return await userService.deleteAllUsers(req.body);
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
	deleteAllUsers,
	resendActivationEmail,
	searchGroups
}
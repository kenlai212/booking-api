"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const userService = require("./user.service");

const USER_ADMIN_GROUP = "USER_ADMIN";

const findUser = asyncMiddleware(async (req) => {
	return await userService.findUser(req.params);
});

const searchUser = asyncMiddleware(async (req) => {
	const queryObject = url.parse(req.url, true).query;
	return await userService.searchUsers(queryObject);
});

const activate = asyncMiddleware(async (req) => {
	return await userService.activate(req.body);
});

const searchUsers = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [USER_ADMIN_GROUP]);

	return await userService.searchUsers(req.params);
});

const assignGroup = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [USER_ADMIN_GROUP]);

	return await userService.assignGroup(req.body);
});

const unassignGroup = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [USER_ADMIN_GROUP]);

	return await userService.unassignGroup(req.body);
});

const deleteUser = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [USER_ADMIN_GROUP]);

	return await userService.deleteUser(req.params);
});

const resendActivationMessage = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [USER_ADMIN_GROUP]);

	return await userService.resendActivationMessage(req.body);
});

const searchGroups = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [USER_ADMIN_GROUP]);

	return await userService.searchGroups(req.params);
});

const deleteAllUsers = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [USER_ADMIN_GROUP]);

	return await userService.deleteAllUsers(req.params);
});

const sendRegistrationInvite = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [USER_ADMIN_GROUP]);

	return await userService.sendRegistrationInvite(req.body);
});

const invitedSocialRegister = asyncMiddleware(async (req) => {
	return await userService.invitedSocialRegister(req.body);
});

const invitedRegister = asyncMiddleware(async (req) => {
	return await userService.invitedRegister(req.body);
});

module.exports = {
	findUser,
	searchUser,
	activate,
	searchUsers,
	assignGroup,
	unassignGroup,
	deleteUser,
	deleteAllUsers,
	resendActivationMessage,
	searchGroups,
	sendRegistrationInvite,
	invitedSocialRegister,
	invitedRegister
}
"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const staffDomain = require("./staff.domain");
const staffRead = require("./staff.read");

const STAFF_ADMIN_GROUP = "STAFF_ADMIN";
const STAFF_USER_GROUP = "STAFF_USER";

const createStaff = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [STAFF_ADMIN_GROUP]);

	return await staffDomain.createStaff(req.body, req.user);
});

const deleteStaff = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [STAFF_ADMIN_GROUP]);

	return await staffDomain.deleteStaff(req.params, req.user);
});

const updateStatus = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [STAFF_ADMIN_GROUP]);

	return await staffDomain.updateStatus(req.body, req.user);
});

const findStaff = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [STAFF_ADMIN_GROUP, STAFF_USER_GROUP]);

	return await staffRead.findStaff(req.params, req.user);
});

const searchStaffs = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [STAFF_ADMIN_GROUP, STAFF_USER_GROUP]);

	const queryObject = url.parse(req.url, true).query;
	return await staffRead.searchStaffs(queryObject, req.user);
});

module.exports = {
	createStaff,
	searchStaffs,
	findStaff,
	deleteStaff,
	updateStatus
}
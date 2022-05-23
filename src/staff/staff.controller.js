"use strict";
const lipslideCommon = require("lipslide-common");

const staffService = require("./staff.service");

const STAFF_ADMIN_GROUP = "STAFF_ADMIN";
const STAFF_USER_GROUP = "STAFF_USER";

const newStaff = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [STAFF_ADMIN_GROUP]);

	return await staffService.newStaff(req.body);
});

const findStaff = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [STAFF_ADMIN_GROUP]);

	return await staffService.findStaff(req.query);
});

module.exports = {
	newStaff,
	findStaff
}
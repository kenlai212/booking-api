"use strict";
const lipslideCommon = require("lipslide-common");

const staffService = require("./staff.service");

const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";

const newStaff = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await staffService.newStaff(req.body);
});

const findStaff = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await staffService.findStaff(req.params);
});

const deleteAllStaffs = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await staffService.deleteAllStaffs(req.params);
});

module.exports = {
	newStaff,
	findStaff,
    deleteAllStaffs
}
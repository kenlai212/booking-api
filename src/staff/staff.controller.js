"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const staffService = require("./staff.service");
const staffRead = require("./staff.read");
const staffPersonService = require("./staffPerson.service");

const CUSTOMER_ADMIN_GROUP = "CUSTOMER_ADMIN";
const CUSTOMER_USER_GROUP = "CUSTOMER_USER";
const BOOKING_USER_GROUP = "BOOKING_USER";
const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";

const newStaff = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [CUSTOMER_ADMIN_GROUP]);

	return await staffService.newStaff(req.body, req.user);
});

const findStaff = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, 
		[
			CUSTOMER_ADMIN_GROUP, 
			CUSTOMER_USER_GROUP,
			BOOKING_USER_GROUP,
			BOOKING_ADMIN_GROUP
		]);

	return await staffRead.findStaff(req.params, req.user);
});

const searchStaffs = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups,
		[
			CUSTOMER_ADMIN_GROUP, 
			CUSTOMER_USER_GROUP,
			BOOKING_USER_GROUP,
			BOOKING_ADMIN_GROUP
		]);

	const queryObject = url.parse(req.url, true).query;
	return await staffRead.searchCustomers(queryObject, req.user);
});

const deleteStaff = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [CUSTOMER_ADMIN_GROUP]);

	return await staffService.deleteStaff(req.params, req.user);
});

const editStatus = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [CUSTOMER_ADMIN_GROUP]);

	return await staffService.editStatus(req.body, req.user);
});

const editPersonalInfo = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [CUSTOMER_ADMIN_GROUP]);

	return await staffPersonService.editPersonalInfo(req.body, req.user);
});

const editContact = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [CUSTOMER_ADMIN_GROUP]);

	return await staffPersonService.editContact(req.body, req.user);
});

const editPicture = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [CUSTOMER_ADMIN_GROUP]);

	return await staffPersonService.editPicture(req.body, req.user);
});

module.exports = {
	newStaff,
	searchStaffs,
	findStaff,
	deleteStaff,
	editStatus,
	editPersonalInfo,
	editContact,
	editPicture
}
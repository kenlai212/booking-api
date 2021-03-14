"use strict";
const url = require("url");
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const customerService = require("./customer.service");
const utility = require("../common/utility");

const CUSTOMER_ADMIN_GROUP = "CUSTOMER_ADMIN";
const CUSTOMER_USER_GROUP = "CUSTOMER_USER";
const BOOKING_USER_GROUP = "BOOKING_USER";
const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";

const newCustomer = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [CUSTOMER_ADMIN_GROUP]);

	return await customerService.newCustomer(req.body, req.user);
});

const findCustomer = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, 
		[
			CUSTOMER_ADMIN_GROUP, 
			CUSTOMER_USER_GROUP,
			BOOKING_USER_GROUP,
			BOOKING_ADMIN_GROUP
		]);

	return await customerService.findCustomer(req.params, req.user);
});

const searchCustomers = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups,
		[
			CUSTOMER_ADMIN_GROUP, 
			CUSTOMER_USER_GROUP,
			BOOKING_USER_GROUP,
			BOOKING_ADMIN_GROUP
		]);

	const queryObject = url.parse(req.url, true).query;
	return await customerService.searchCustomers(queryObject, req.user);
});

const deleteCustomer = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [CUSTOMER_ADMIN_GROUP]);

	return await customerService.deleteCustomer(req.params, req.user);
});

const editStatus = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [CUSTOMER_ADMIN_GROUP]);

	return await customerService.editStatus(req.body, req.user);
});

const editPersonalInfo = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [CUSTOMER_ADMIN_GROUP]);

	return await customerService.editPersonalInfo(req.body, req.user);
});

const editContact = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [CUSTOMER_ADMIN_GROUP]);

	return await customerService.editContact(req.body, req.user);
});

const editPicture = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [CUSTOMER_ADMIN_GROUP]);

	return await customerService.editPicture(req.body, req.user);
});

module.exports = {
	newCustomer,
	searchCustomers,
	findCustomer,
	deleteCustomer,
	editStatus,
	editPersonalInfo,
	editContact,
	editPicture
}
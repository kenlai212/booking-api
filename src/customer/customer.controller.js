"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const customerService = require("./customer.service");
const customerRead = require("./customer.read");

const CUSTOMER_ADMIN_GROUP = "CUSTOMER_ADMIN";
const CUSTOMER_USER_GROUP = "CUSTOMER_USER";
const BOOKING_USER_GROUP = "BOOKING_USER";
const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";

const allGroups = [
	CUSTOMER_ADMIN_GROUP, 
	CUSTOMER_USER_GROUP,
	BOOKING_USER_GROUP,
	BOOKING_ADMIN_GROUP
]

const newCustomer = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [CUSTOMER_ADMIN_GROUP]);

	const input = req.body;
	input.requestorId = req.requestor.id;

	return await customerService.newCustomer(input);
});

const findCustomer = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, allGroups);

	const queryObject = url.parse(req.url, true).query;
	return await customerRead.findCustomer(queryObject);
});

const searchCustomers = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, allGroups);

	const queryObject = url.parse(req.url, true).query;
	return await customerRead.searchCustomers(queryObject);
});

const deleteCustomer = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [CUSTOMER_ADMIN_GROUP]);

	return await customerService.deleteCustomer(req.params);
});

const updateStatus = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [CUSTOMER_ADMIN_GROUP]);

	return await customerService.updateStatus(req.body);
});

const deleteAllCustomers = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [CUSTOMER_ADMIN_GROUP]);

	return await customerService.deleteAllCustomers(req.params);
});

module.exports = {
	newCustomer,
	searchCustomers,
	findCustomer,
	deleteCustomer,
	updateStatus,
	deleteAllCustomers
}
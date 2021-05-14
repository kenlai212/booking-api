"use strict";
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const customerService = require("./customer.service");

const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";

const newCustomer = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [BOOKING_ADMIN_GROUP]);

	return await customerService.newCustomer(req.body);
});

const deleteAllCustomers = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [BOOKING_ADMIN_GROUP]);

	return await customerService.deleteAllCustomers(req.body);
});

module.exports = {
	newCustomer,
	deleteAllCustomers
}
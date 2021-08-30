"use strict";
const lipslideCommon = require("lipslide-common");

const customerService = require("./customer.service");

const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";

const newCustomer = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await customerService.newCustomer(req.body);
});

const findCustomer = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await customerService.findCustomer(req.params);
});

const deleteAllCustomers = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await customerService.deleteAllCustomers(req.params);
});

module.exports = {
	newCustomer,
	findCustomer,
    deleteAllCustomers
}
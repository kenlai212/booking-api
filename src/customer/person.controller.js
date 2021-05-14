"use strict";
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const personService = require("./person.service");

const CUSTOMER_ADMIN_GROUP = "CUSTOMER_ADMIN";

const newPerson = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [CUSTOMER_ADMIN_GROUP]);

	return await personService.newPerson(req.body);
});

const findPerson = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [CUSTOMER_ADMIN_GROUP]);

	return await personService.findPerson(req.params);
});

const deleteAllPeople = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [CUSTOMER_ADMIN_GROUP]);

	return await personService.deleteAllPeople(req.params);
});

module.exports = {
	newPerson,
	findPerson,
	deleteAllPeople
}


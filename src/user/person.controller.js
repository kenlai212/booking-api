"use strict";
const utility = require("../common/utility");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const personService = require("./person.service");

const USER_ADMIN_GROUP = "USER_ADMIN";

const newPerson = asyncMiddleware(async (req) => {
    utility.userGroupAuthorization(req.requestor.groups, [USER_ADMIN_GROUP]);

	return await personService.newPerson(req.body);
});

const deletePerson = asyncMiddleware(async (req) => {
    utility.userGroupAuthorization(req.requestor.groups, [USER_ADMIN_GROUP]);

	return await personService.deletePerson(req.params);
});

const deleteAllPeople = asyncMiddleware(async (req) => {
    utility.userGroupAuthorization(req.requestor.groups, [USER_ADMIN_GROUP]);

	return await personService.deleteAllPeople(req.params);
});

module.exports = {
	newPerson,
	deletePerson,
	deleteAllPeople
}
"use strict";
const lipslideCommon = require("lipslide-common");

const personService = require("./person.service");

const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";

const newPerson = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await personService.newPerson(req.body);
});

const findPerson = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await personService.findPerson(req.params);
});

const deletePerson = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await personService.deletePerson(req.params);
});

const deleteAllPersons = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await personService.deleteAllPersons(req.params);
});

module.exports = {
	newPerson,
	findPerson,
	deletePerson,
    deleteAllPersons
}
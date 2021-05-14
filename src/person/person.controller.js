"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const personRead = require("./person.read");
const personService = require("./person.service");

const PERSON_ADMIN_GROUP = "PERSON_ADMIN";
const PERSON_USER_GROUP = "PERSON_USER";

const readPerson = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personRead.readPerson(req.params);
});

const readPersons = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [PERSON_ADMIN_GROUP]);

	const queryObject = url.parse(req.url, true).query;
	return await personRead.readPersons(queryObject);
});

const newPerson = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	const input = req.body;
	input.requestorId = req.requestor.id;

	return await personService.newPerson(input);
});

const deletePerson = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [PERSON_ADMIN_GROUP]);

	return await personService.deletePerson(req.params);
});

const updateName = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personService.updateName(req.body);
});

const updateDob = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personService.updateDob(req.body);
});

const updateGender = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personService.updateGender(req.body);
});

const updateEmailAddress = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personService.updateEmailAddress(req.body);
});

const updateMobile = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personService.updateMobile(req.body);
});

const updateProfilePicture = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personService.updateProfilePicture(req.body);
});

const updateRoles = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [PERSON_ADMIN_GROUP]);

	return await personService.updateRoles(req.body);
});

const updatePreferredContactMethod = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [PERSON_ADMIN_GROUP]);

	return await personService.editPreferredContactMethod(req.body);
});

const updatePreferredLanguage = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [PERSON_ADMIN_GROUP]);

	return await personService.editPreferredLanguage(req.body);
});

const sendMessage = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [PERSON_ADMIN_GROUP]);

	return await personService.sendMessage(req.body);
});

const deleteAllPeople = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [PERSON_ADMIN_GROUP]);

	return await personService.deleteAllPeople(req.params);
});

module.exports = {
	readPerson,
	readPersons,
	deletePerson,
	newPerson,
	updateName,
	updateDob,
	updateGender,
	updateEmailAddress,
	updateMobile,
	updateProfilePicture,
	updateRoles,
	updatePreferredContactMethod,
	updatePreferredLanguage,
	sendMessage,
	deleteAllPeople
}
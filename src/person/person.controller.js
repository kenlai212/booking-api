"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const personRead = require("./person.read");
const personService = require("./person.service");
const personDomain = require("./person.domain");

const PERSON_ADMIN_GROUP = "PERSON_ADMIN";
const PERSON_USER_GROUP = "PERSON_USER";

const readPerson = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personRead.readPerson(req.params, req.user);
});

const readPersons = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP]);

	const queryObject = url.parse(req.url, true).query;
	return await personRead.readPersons(queryObject, req.user);
});

const newPerson = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personService.newPerson(req.body, req.user);
});

const deletePerson = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP]);

	return await personService.deletePerson(req.body, req.user);
});

const updateName = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personService.updateName(req.body, req.user);
});

const updateDob = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personService.updateDob(req.body, req.user);
});

const updateGender = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personService.updateGender(req.body, req.user);
});

const updateEmailAddress = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personService.updateEmailAddress(req.body, req.user);
});

const updateMobile = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personService.updateMobile(req.body, req.user);
});

const updateProfilePicture = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personService.updateProfilePicture(req.body, req.user);
});

const updateRoles = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP]);

	return await personService.updateRoles(req.body, req.user);
});

const updatePreferredContactMethod = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP]);

	return await personService.editPreferredContactMethod(req.body, req.user);
});

const updatePreferredLanguage = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP]);

	return await personService.editPreferredLanguage(req.body, req.user);
});

const sendMessage = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP]);

	return await personService.sendMessage(req.body, req.user);
});

const sendRegistrationInvite = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP]);

	return await personService.sendRegistrationInvite(req.body, req.user);
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
	sendRegistrationInvite
}
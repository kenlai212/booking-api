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

const createParty = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personDomain.createParty(req.body, req.user);
});

const deleteParty = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP]);

	return await personDomain.deleteParty(req.body, req.user);
});

const updateName = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personDomain.updateName(req.body, req.user);
});

const updateDob = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personDomain.updateDob(req.body, req.user);
});

const updateGender = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personDomain.updateGender(req.body, req.user);
});

const updateEmailAddress = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personDomain.updateEmailAddress(req.body, req.user);
});

const updateMobile = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personDomain.updateMobile(req.body, req.user);
});

const updateProfilePicture = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personDomain.updateProfilePicture(req.body, req.user);
});

const updateRoles = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP]);

	return await personDomain.updateRoles(req.body, req.user);
});

const updatePreferredContactMethod = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP]);

	return await personDomain.editPreferredContactMethod(req.body, req.user);
});

const updatePreferredLanguage = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP]);

	return await personDomain.editPreferredLanguage(req.body, req.user);
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
	deleteParty,
	createParty,
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
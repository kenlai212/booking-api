"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const personRead = require("./person.read");
const personService = require("./person.service");

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

const editPicture = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personService.editPicture(req.body, req.user);
});

const editContact = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personService.editContact(req.body, req.user);
});

const editPersonalInfo = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personService.editPersonalInfo(req.body, req.user);
});

const createNewParty = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP, PERSON_USER_GROUP]);

	return await personService.createNewParty(req.body, req.user);
});

const deleteParty = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP]);

	return await personService.deleteParty(req.body, req.user);
});

const addRole = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP]);

	return await personService.addRole(req.body, req.user);
});

const removeRole = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP]);

	return await personService.removeRole(req.body, req.user);
});

const sendMessage = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP]);

	return await personService.sendMessage(req.body, req.user);
});

const sendRegistrationInvite = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP]);

	return await personService.sendRegistrationInvite(req.body, req.user);
});

const changePreferredContactMethod = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PERSON_ADMIN_GROUP]);

	return await personService.changePreferredContactMethod(req.body, req.user);
});

module.exports = {
	readPerson,
	readPersons,
	deleteParty,
	createNewParty,
	editPersonalInfo,
	editContact,
	editPicture,
	addRole,
	removeRole,
	sendMessage,
	sendRegistrationInvite,
	changePreferredContactMethod
}
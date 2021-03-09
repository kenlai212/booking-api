"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const partyService = require("./party.service");

const PARTY_ADMIN_GROUP = "PARTY_ADMIN";
const PARTY_USER_GROUP = "PARTY_USER";

const readParty = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP, PARTY_USER_GROUP]);

	return await partyService.readParty(req.params, req.user);
});

const readParties = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP]);

	const queryObject = url.parse(req.url, true).query;
	return await partyService.readParties(queryObject, req.user);
});

const editPicture = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP, PARTY_USER_GROUP]);

	return await partyService.editPicture(req.body, req.user);
});

const editContact = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP, PARTY_USER_GROUP]);

	return await partyService.editContact(req.body, req.user);
});

const editPersonalInfo = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP, PARTY_USER_GROUP]);

	return await partyService.editPersonalInfo(req.body, req.user);
});

const createNewParty = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP, PARTY_USER_GROUP]);

	return await partyService.createNewParty(req.body, req.user);
});

const deleteParty = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP]);

	return await partyService.deleteParty(req.body, req.user);
});

const addRole = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP]);

	return await partyService.addRole(req.body, req.user);
});

const removeRole = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP]);

	return await partyService.removeRole(req.body, req.user);
});

const sendMessage = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP]);

	return await partyService.sendMessage(req.body, req.user);
});

const sendRegistrationInvite = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP]);

	return await partyService.sendRegistrationInvite(req.body, req.user);
});

const changePreferredContactMethod = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP]);

	return await partyService.changePreferredContactMethod(req.body, req.user);
});

module.exports = {
	readParty,
	readParties,
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
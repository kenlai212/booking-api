"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const partyWriteService = require("./party.write.service");
const partyReadDomain = require("./party.read.service");

const PARTY_ADMIN_GROUP = "PARTY_ADMIN";
const PARTY_USER_GROUP = "PARTY_USER";

///////////////////////////read controllers/////////////////////////////////////
const readParty = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP, PARTY_USER_GROUP]);

	return await partyReadDomain.readParty(req.params, req.user);
});

const readParties = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP]);

	const queryObject = url.parse(req.url, true).query;
	return await partyReadDomain.readParties(queryObject, req.user);
});

//////////////////////////write controllers/////////////////////////////////////

const editPicture = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP, PARTY_USER_GROUP]);

	return await partyWriteService.editPicture(req.body, req.user);
});

const editContact = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP, PARTY_USER_GROUP]);

	return await partyWriteService.editContact(req.body, req.user);
});

const editPersonalInfo = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP, PARTY_USER_GROUP]);

	return await partyWriteService.editPersonalInfo(req.body, req.user);
});

const createNewParty = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP, PARTY_USER_GROUP]);

	return await partyWriteService.createNewParty(req.body, req.user);
});

const deleteParty = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP]);

	return await partyWriteService.deleteParty(req.body, req.user);
});

const addRole = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP]);

	return await partyWriteService.addRole(req.body, req.user);
});

const removeRole = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP]);

	return await partyWriteService.removeRole(req.body, req.user);
});

const sendMessage = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP]);

	return await partyWriteService.sendMessage(req.body, req.user);
});

const sendRegistrationInvite = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP]);

	return await partyWriteService.sendRegistrationInvite(req.body, req.user);
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
	sendRegistrationInvite
}
"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const partyService = require("./party.service");
const partyDomain = require("./party.domain");

const PARTY_ADMIN_GROUP = "PARTY_ADMIN";
const PARTY_USER_GROUP = "PARTY_USER";

///////////////////////////domain controllers/////////////////////////////////////

const createParty = asyncMiddleware(async req => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP]);

	return await partyDomain.createParty(req.body, req.user);
});

const readParty = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP, PARTY_USER_GROUP]);

	return await partyDomain.readParty(req.params, req.user);
});

const readParties = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP]);

	const queryObject = url.parse(req.url, true).query;
	return await partyDomain.readParties(queryObject, req.user);
});

const updateParty = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP]);

	return await partyDomain.updateParty(req.body, req.user);
});

const deleteParty = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP]);

	return await partyDomain.deleteParty(req.body, req.user);
});

//////////////////////////service controllers/////////////////////////////////////

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

module.exports = {
	createParty,
	readParty,
	readParties,
	updateParty,
	deleteParty,
	createNewParty,
	editPersonalInfo,
	editContact,
	editPicture
}
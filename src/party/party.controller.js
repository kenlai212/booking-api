"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const partyService = require("./party.service");
const utility = require("../common/utility");

const PARTY_ADMIN_GROUP = "PARTY_ADMIN";
const PARTY_USER_GROUP = "PARTY_USER";

const editPicture = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP, PARTY_USER_GROUP]);

	return await partyService.editPicture(req.body, req.user);
});

const editContact = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP, PARTY_USER_GROUP]);

	return await partyService.editContact(req.body, req.user);
});

const editPersonalInfo = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP, PARTY_USER_GROUP]);

	return await partyService.editPersonalInfo(req.body, req.user);
});

const findParty = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP, PARTY_USER_GROUP]);

	return await partyService.findParty(req.params, req.user);
});

const deleteParty = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP]);

	return await partyService.deleteParty(req.params, req.user);
});

const createNewParty = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP, PARTY_USER_GROUP]);

	return await partyService.createNewParty(req.body, req.user);
});

const searchParty = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [PARTY_ADMIN_GROUP]);

	const queryObject = url.parse(req.url, true).query;
	return await partyService.searchParty(queryObject, req.user);
});

module.exports = {
	createNewParty,
	searchParty,
	deleteParty,
	findParty,
	editPersonalInfo,
	editContact,
	editPicture
}
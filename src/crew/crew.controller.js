"use strict";
const url = require("url");
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const crewService = require("./crew.service");
const utility = require("../common/utility");

const CREW_ADMIN_GROUP = "CREW_ADMIN";
const CREW_USER_GROUP = "CREW_USER";

const newCrew = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [CREW_ADMIN_GROUP]);

	return await crewService.newCrew(req.body, req.user);
});

const findCrew = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [CREW_ADMIN_GROUP, CREW_USER_GROUP]);

	return await crewService.findCrew(req.params, req.user);
});

const searchCrews = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [CREW_ADMIN_GROUP]);

	const queryObject = url.parse(req.url, true).query;
	return await crewService.searchCrews(queryObject, req.user);
});

const deleteCrew = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [CREW_ADMIN_GROUP]);

	return await crewService.deleteCrew(req.params, req.user);
});

const editStatus = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [CREW_ADMIN_GROUP]);

	return await crewService.editStatus(req.body, req.user);
});

const editPersonalInfo = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [CREW_ADMIN_GROUP]);

	return await crewService.editPersonalInfo(req.body, req.user);
});

const editContact = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [CREW_ADMIN_GROUP]);

	return await crewService.editContact(req.body, req.user);
});

const editPicture = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [CREW_ADMIN_GROUP]);

	return await crewService.editPicture(req.body, req.user);
});

module.exports = {
	newCrew,
	searchCrews,
	findCrew,
	deleteCrew,
	editStatus,
	editPersonalInfo,
	editContact,
	editPicture
}
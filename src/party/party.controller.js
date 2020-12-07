"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const partyService = require("./party.service");
const userAuthorization = require("../common/middleware/userAuthorization");

const PARTY_ADMIN_GROUP = "PARTY_ADMIN";
const PARTY_USER_GROUP = "PARTY_USER";

const editProfile = asyncMiddleware(async (req) => {
	//validate user group
	const rightsGroup = [
		PARTY_ADMIN_GROUP,
		PARTY_USER_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		return { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await partyService.editProfile(req.body, req.user);
});

const getParty = asyncMiddleware(async (req) => {
	//validate user group
	const rightsGroup = [
		PARTY_ADMIN_GROUP,
		PARTY_USER_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		return { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await partyService.getParty(req.params, req.user);
});

const deleteParty = asyncMiddleware(async (req) => {
	//validate user group
	const rightsGroup = [
		PARTY_ADMIN_GROUP,
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		return { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await partyService.deleteParty(req.params, req.user);
});

const createNewParty = asyncMiddleware(async (req) => {
	//validate user group
	const rightsGroup = [
		PARTY_ADMIN_GROUP,
		PARTY_USER_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		return { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await partyService.createNewParty(req.body, req.user);
});

const searchParty = asyncMiddleware(async (req) => {
	//validate user group
	const rightsGroup = [
		PARTY_ADMIN_GROUP,
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		return { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	const queryObject = url.parse(req.url, true).query;
	return await partyService.searchParty(queryObject, req.user);
});

module.exports = {
	createNewParty,
	searchParty,
	deleteParty,
	getParty,
	editProfile
}
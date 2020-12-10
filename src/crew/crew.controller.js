"use strict";
const url = require("url");
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const crewService = require("./crew.service");
const userAuthorization = require("../common/middleware/userAuthorization");

const CREW_ADMIN_GROUP = "CREW_ADMIN";
const CREW_USER_GROUP = "CREW_USER";

const newCrew = asyncMiddleware(async (req) => {
	const rightsGroup = [
		CREW_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await crewService.newCrew(req.body, req.user);
});

const findCrew = asyncMiddleware(async (req) => {
	const rightsGroup = [
		CREW_ADMIN_GROUP,
		CREW_USER_GROUP
	]

	//validate user
	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await crewService.findCrew(req.params, req.user);
});

const searchCrews = asyncMiddleware(async (req, res) => {
	const rightsGroup = [
		CREW_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	const queryObject = url.parse(req.url, true).query;
	return await crewService.searchCrews(queryObject, req.user);
});

const deleteCrew = asyncMiddleware(async (req, res) => {
	const rightsGroup = [
		CREW_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await crewService.deleteCrew(req.params, req.user);
});

const editStatus = asyncMiddleware(async (req, res) => {
	const rightsGroup = [
		CREW_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await crewService.editStatus(req.body, req.user);
});

const editProfile = asyncMiddleware(async (req, res) => {
	const rightsGroup = [
		CREW_ADMIN_GROUP
	]

	//validate user
	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await crewService.editProfile(req.body, req.user);
});

module.exports = {
	newCrew,
	searchCrews,
	findCrew,
	deleteCrew,
	editStatus,
	editProfile
}
"use strict";
const utility = require("../common/utility");
const {customError} = utility;

const userAuthorization = require("../common/middleware/userAuthorization");
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const boatService = require("./boat.service");

const newBoat = asyncMiddleware(async (req) => {
	//validate user
	const rightsGroup = [
		ASSET_ADMIN_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await boatService.newBoat(req.body, req.user);
});

const setFuelLevel = asyncMiddleware(async (req) => {
	//validate user
	const rightsGroup = [
		ASSET_ADMIN_GROUP,
		ASSET_USER_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await boatService.setFuelLevel(req.body, req.user);
});

const findBoat = asyncMiddleware(async (req) => {
	//validate user
	const rightsGroup = [
		ASSET_ADMIN_GROUP,
		ASSET_USER_GROUP
	]

	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await boatService.findBoat(req.params, req.user);
});

module.exports = {
	newBoat,
	setFuelLevel,
	findBoat
}
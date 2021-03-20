"use strict";
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const boatService = require("./boat.service");

const ASSET_ADMIN_GROUP = "ASSET_ADMIN";
const ASSET_USER_GROUP = "ASSET_USER";

const newBoat = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [ASSET_ADMIN_GROUP]);

	return await boatService.newBoat(req.body, req.user);
});

const setFuelLevel = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [ASSET_ADMIN_GROUP, ASSET_USER_GROUP]);

	return await boatService.setFuelLevel(req.body, req.user);
});

const findBoat = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [ASSET_ADMIN_GROUP, ASSET_USER_GROUP]);

	return await boatService.findBoat(req.params, req.user);
});

module.exports = {
	newBoat,
	setFuelLevel,
	findBoat
}
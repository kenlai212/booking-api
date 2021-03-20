"use strict";
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const fuelReserviorService = require("./fuelReservior.service");

const ASSET_ADMIN_GROUP = "ASSET_ADMIN";
const ASSET_USER_GROUP = "ASSET_USER";

const newFuelReservior = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [ASSET_ADMIN_GROUP]);

	return await fuelReserviorService.newFuelReservior(req.body, req.user);
});

const editCanisters = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [ASSET_ADMIN_GROUP, ASSET_USER_GROUP]);

	return await fuelReserviorService.editCanisters(req.body, req.user);
});

const findFuelReservior = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [ASSET_ADMIN_GROUP, ASSET_USER_GROUP]);

	return await fuelReserviorService.findFuelReservior(req.params, req.user);
});

module.exports = {
	newFuelReservior,
	editCanisters,
	findFuelReservior
}
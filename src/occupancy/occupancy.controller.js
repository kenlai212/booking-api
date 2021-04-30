"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const occupancyService = require("./occupancy.service");

const OCCUPANCY_ADMIN_GROUP = "OCCUPANCY_ADMIN";
const OCCUPANCY_POWER_USER_GROUP = "OCCUPANCY_POWER_USER";
const OCCUPANCY_USER_GROUP = "OCCUPANCY_USER";
const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";
const BOOKING_USER_GROUP = "BOOKING_USER";

const userGroups = [
	OCCUPANCY_ADMIN_GROUP,
	OCCUPANCY_POWER_USER_GROUP,
	OCCUPANCY_USER_GROUP,
	BOOKING_ADMIN_GROUP,
	BOOKING_USER_GROUP
]

const adminGroups = [
	OCCUPANCY_ADMIN_GROUP,
	OCCUPANCY_POWER_USER_GROUP,
	BOOKING_ADMIN_GROUP
]

const occupyAsset = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, userGroups);

	return await occupancyService.occupyAsset(req.body);
});

const getOccupancies = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, userGroups);

	const queryObject = url.parse(req.url, true).query;
	return await occupancyService.getOccupancies(queryObject);
});

const releaseOccupancy = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, adminGroups);

	return await occupancyService.releaseOccupancy(req.params);
});

const confirmOccupancy = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, adminGroups);

	return await occupancyService.confirmOccupancy(req.body);
});

module.exports = {
	getOccupancies,
	occupyAsset,
	releaseOccupancy,
	confirmOccupancy
}
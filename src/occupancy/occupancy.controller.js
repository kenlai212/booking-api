"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const occupancyService = require("./occupancy.service");
const occupancyRead = require("./occupancy.read");

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
	utility.userGroupAuthorization(req.requestor.groups, userGroups);

	return await occupancyService.occupyAsset(req.body);
});

const releaseOccupancy = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, adminGroups);

	return await occupancyService.releaseOccupancy(req.params);
});

const confirmOccupancy = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, adminGroups);

	return await occupancyService.confirmOccupancy(req.body);
});

const deleteAllOccupancies = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, adminGroups);

	return await occupancyService.deleteAllOccupancies(req.params);
});

const getOccupancies = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, userGroups);

	const queryObject = url.parse(req.url, true).query;
	return await occupancyRead.getOccupancies(queryObject);
});

const getOccupancy = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, userGroups);

	return await occupancyRead.getOccupancy(req.params);
});

module.exports = {
	occupyAsset,
	releaseOccupancy,
	confirmOccupancy,
	deleteAllOccupancies,
	getOccupancies,
	getOccupancy
}
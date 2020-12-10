"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const occupancyService = require("./occupancy.service");
const userAuthorization = require("../common/middleware/userAuthorization");

const OCCUPANCY_ADMIN_GROUP = "OCCUPANCY_ADMIN";
const OCCUPANCY_POWER_USER_GROUP = "OCCUPANCY_POWER_USER";
const OCCUPANCY_USER_GROUP = "OCCUPANCY_USER";
const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";
const BOOKING_USER_GROUP = "BOOKING_USER";

const occupyAsset = asyncMiddleware(async (req) => {
	//validate user group
	const rightsGroup = [
		OCCUPANCY_ADMIN_GROUP,
		OCCUPANCY_POWER_USER_GROUP,
		OCCUPANCY_USER_GROUP,
		BOOKING_ADMIN_GROUP,
		BOOKING_USER_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		return { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await occupancyService.occupyAsset(req.body);
});

const getOccupancies = asyncMiddleware(async (req) => {

	//validate user group
	const rightsGroup = [
		OCCUPANCY_ADMIN_GROUP,
		OCCUPANCY_POWER_USER_GROUP,
		OCCUPANCY_USER_GROUP,
		BOOKING_ADMIN_GROUP,
		BOOKING_USER_GROUP
	]
	
	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		return { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	const queryObject = url.parse(req.url, true).query;
	return await occupancyService.getOccupancies(queryObject);
});

const releaseOccupancy = asyncMiddleware(async (req) => {
	//validate user group
	const rightsGroup = [
		OCCUPANCY_ADMIN_GROUP,
		OCCUPANCY_POWER_USER_GROUP,
		BOOKING_ADMIN_GROUP
	]

	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" }
	}

	return await occupancyService.releaseOccupancy(req.params);
});

module.exports = {
	getOccupancies,
	occupyAsset,
	releaseOccupancy
}
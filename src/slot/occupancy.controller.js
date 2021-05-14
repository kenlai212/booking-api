"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const occupancyService = require("./occupancy.service");

const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";

const newOccupancy = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await occupancyService.newOccupancy(req.body);
});

const deleteOccupancy = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await occupancyService.deleteOccupancy(req.params);
});

const deleteAllOccupancies = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await occupancyService.deleteAllOccupancies(req.params);
});

module.exports = {
	newOccupancy,
	deleteOccupancy,
    deleteAllOccupancies
}
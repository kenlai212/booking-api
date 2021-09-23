"use strict";
const lipslideCommon = require("lipslide-common");

const occupancyService = require("./occupancy.service");

const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";

const newOccupancy = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await occupancyService.newOccupancy(req.body);
});

const updateOccupancy = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await occupancyService.updateOccupancy(req.body);
});

const findOccupancy = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await occupancyService.findOccupancy(req.params);
});

const deleteOccupancy = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await occupancyService.deleteOccupancy(req.params);
});

const deleteAllOccupancies = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await occupancyService.deleteAllOccupancies(req.params);
});

module.exports = {
	newOccupancy,
	updateOccupancy,
	findOccupancy,
	deleteOccupancy,
    deleteAllOccupancies
}
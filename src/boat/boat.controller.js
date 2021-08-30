"use strict";
const lipslideCommon = require("lipslide-common");

const boatService = require("./boat.service");

const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";

const newBoat = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await boatService.newBoat(req.body);
});

const findBoat = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await boatService.findBoat(req.params);
});

const deleteAllBoats = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await boatService.deleteAllBoats(req.params);
});

module.exports = {
	newBoat,
	findBoat,
    deleteAllBoats
}
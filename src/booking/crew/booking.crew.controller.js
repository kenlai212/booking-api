"use strict";
const asyncMiddleware = require("../../common/middleware/asyncMiddleware");
const utility = require("../../common/utility");

const bookingCommon = require("../booking.common");
const crewService = require("./booking.crew.service");

const assignCrew = asyncMiddleware(async (req,) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [bookingCommon.BOOKING_ADMIN_GROUP]);

	return await crewService.assignCrew(req.body, req.user);
});

const relieveCrew = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [bookingCommon.BOOKING_ADMIN_GROUP]);

	return await crewService.relieveCrew(req.params, req.user);
});

module.exports = {
	assignCrew,
	relieveCrew
}

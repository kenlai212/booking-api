"use strict";
const asyncMiddleware = require("../../common/middleware/asyncMiddleware");
const utility = require("../../common/utility");

const bookingCommon = require("../booking.common");

const statusService = require("./booking.status.service");

const confirmBooking = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [
		bookingCommon.BOOKING_ADMIN_GROUP
	]);

	return await statusService.confirmBooking(req.body, req.user);
});

const cancelBooking = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [
		bookingCommon.BOOKING_ADMIN_GROUP
	]);

	return await statusService.cancelBooking(req.body, req.user);
});

const fulfillBooking = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [
		bookingCommon.BOOKING_ADMIN_GROUP
	]);

	return await statusService.fulfillBooking(req.body, req.user);
});

module.exports = {
	confirmBooking,
	cancelBooking,
	fulfillBooking
}
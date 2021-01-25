"use strict";
const asyncMiddleware = require("../../common/middleware/asyncMiddleware");
const utility = require("../../common/utility");

const bookingCommon = require("../booking.common");
const guestService = require("./booking.guest.service");

const removeGuest = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]);

	return await guestService.removeGuest(req.params, req.user);
});

const addGuest = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]);

	return await guestService.addGuest(req.body, req.user);
});

module.exports = {
	addGuest,
	removeGuest
}

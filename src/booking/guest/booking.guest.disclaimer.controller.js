"use strict";
const utility = require("../../common/utility");
const asyncMiddleware = require("../../common/middleware/asyncMiddleware");
const bookingCommon = require("../booking.common");

const disclaimerService = require("./booking.guest.disclaimer.service");

const sendDisclaimerNotification = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]);

	return await disclaimerService.sendDisclaimer(req.body, req.user);
});

const signDisclaimer = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]);

	return await disclaimerService.signDisclaimer(req.body);
});

module.exports = {
	sendDisclaimerNotification,
	signDisclaimer
}
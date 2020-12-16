"use strict";
const asyncMiddleware = require("../../common/middleware/asyncMiddleware");
const utility = require("../../common/utility");

const bookingCommon = require("../booking.common");
const hostService = require("./booking.host.service");

const editPersonalInfo = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]);

	return await hostService.editPersonalInfo(req.body, req.user);
});

module.exports = {
	editPersonalInfo
}
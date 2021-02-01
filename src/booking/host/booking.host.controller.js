"use strict";
const url = require("url");

const asyncMiddleware = require("../../common/middleware/asyncMiddleware");
const utility = require("../../common/utility");

const hostService = require("./booking.host.service");
const bookingCommon = require("../booking.common");

const addHost = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]);
	
	return await hostService.addHost(req.body, req.user);
});

module.exports = {
	addHost
}
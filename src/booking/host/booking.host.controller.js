"use strict";
const userAuthorization = require("../../common/middleware/userAuthorization");
const asyncMiddleware = require("../../common/middleware/asyncMiddleware");
const customError = require("../../common/customError");
const hostService = require("./booking.host.service");

const editHost = asyncMiddleware(async (req) => {
	//validate user
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await hostService.editHost(req.body, req.user);
});

module.exports = {
	editHost
}
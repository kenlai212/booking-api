"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const slotService = require("./slot.service");

const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";
const BOOKING_USER_GROUP = "BOOKING_USER";

const slots = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [
		BOOKING_ADMIN_GROUP,
		BOOKING_USER_GROUP
	]);

	const queryObject = url.parse(req.url, true).query;
	return await slotService.getSlots(queryObject);
});

const endSlots = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [
		BOOKING_ADMIN_GROUP,
		BOOKING_USER_GROUP
	]);

	const queryObject = url.parse(req.url, true).query;
	return await slotService.getEndSlots(queryObject);
});

module.exports = {
	slots,
	endSlots
}

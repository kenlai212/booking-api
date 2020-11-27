"use strict";
const url = require("url");

const userAuthorization = require("../common/middleware/userAuthorization");
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const slotService = require("./slot.service");

const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";
const BOOKING_USER_GROUP = "BOOKING_USER";

const slots = asyncMiddleware(async (req, res) => {
	//validate user group rights
	const rightsGroup = [
		BOOKING_ADMIN_GROUP,
		BOOKING_USER_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	const queryObject = url.parse(req.url, true).query;
	return await slotService.getSlots(queryObject, req.user);
});

const endSlots = asyncMiddleware(async (req, res) => {
	//validate user group rights
	const rightsGroup = [
		BOOKING_ADMIN_GROUP,
		BOOKING_USER_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	const queryObject = url.parse(req.url, true).query;
	return await slotService.getEndSlots(queryObject, req.user);
});

module.exports = {
	slots,
	endSlots
}

"use strict";
const guestService = require("./booking.guest.service");
const userAuthorization = require("../../common/middleware/userAuthorization");
const asyncMiddleware = require("../../common/middleware/asyncMiddleware");
const customError = require("../../common/customError");

const removeGuest = asyncMiddleware(async (req) => {
	//validate user group
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await guestService.removeGuest(req.params, req.user);
});

const addGuest = asyncMiddleware(async (req) => {
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]

	//validate user
	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await guestService.addGuest(req.body, req.user);
});

const editGuest = asyncMiddleware(async (req) => {
	//validate user
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await guestService.editGuest(req.body, req.user);
});

module.exports = {
	addGuest,
	removeGuest,
	editGuest
}

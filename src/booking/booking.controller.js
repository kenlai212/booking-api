"use strict";
const url = require("url");

const userAuthorization = require("../common/middleware/userAuthorization");
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const customError = require("../common/customError");
const bookingService = require("./booking.service");

const newBooking = asyncMiddleware(async (req) => {
	//validate user
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await bookingService.addNewBooking(req.body, req.user);
});

const cancelBooking = asyncMiddleware(async (req) => {
	//validate user
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await bookingService.cancelBooking(req.body, req.user);
});

const fulfillBooking = asyncMiddleware(async (req) => {
	//validate user
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await bookingService.fulfillBooking(req.body, req.user);
});

const searchBookings = asyncMiddleware(async (req) => {
	//validate user
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	const queryObject = url.parse(req.url, true).query;
	return await bookingService.viewBookings(queryObject, req.user);
});

const findBooking = asyncMiddleware(async (req) => {
	//validate user
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await bookingService.findBookingById(req.params, req.user);
});

module.exports = {
	newBooking,
	cancelBooking,
	fulfillBooking,
	searchBookings,
	findBooking
}

"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const bookingService = require("./booking.service");
const bookingRead = require("./booking.read");

const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";
const BOOKING_USER_GROUP = "BOOKING_USER";

const newBooking = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP,BOOKING_USER_GROUP]);

	const input = req.body;
	input.requestorId = req.requestor.id;

	return await bookingService.newBooking(input);
});

const searchBookings = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	const queryObject = url.parse(req.url, true).query;
	return await bookingRead.viewBookings(queryObject);
});

const cancelBooking = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await bookingService.cancelBooking(req.body);
});

const fulfillBooking = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await bookingService.fulfillBooking(req.body);
});

const findBooking = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP, BOOKING_USER_GROUP]);

	return await bookingRead.findBookingById(req.params);
});

const confirmBooking = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await bookingService.confirmBooking(req.body);
});

const deleteAllBookings = asyncMiddleware(async(req) => {
	utility.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await bookingService.deleteAllBookings(req.params)
});

module.exports = {
	newBooking,
	confirmBooking,
	cancelBooking,
	fulfillBooking,
	searchBookings,
	findBooking,
	deleteAllBookings
}

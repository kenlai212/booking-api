"use strict";
const lipslideCommon = require("lipslide-common");

const wakesurfBookingService = require("./wakesurfBooking.service");

const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";
const BOOKING_USER_GROUP = "BOOKING_USER";

const newBooking = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP,BOOKING_USER_GROUP]);

	return await wakesurfBookingService.newBooking(req.body);
});

const cancelBooking = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await wakesurfBookingService.cancelBooking(req.body);
});

const fulfillBooking = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await wakesurfBookingService.fulfillBooking(req.body);
});

const findBooking = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP, BOOKING_USER_GROUP]);

	return await wakesurfBookingService.findBooking(req.params);
});

const searchBookings = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP, BOOKING_USER_GROUP]);

	return await wakesurfBookingService.searchBookings(req.params);
});

const confirmBooking = lipslideCommon.asyncMiddleware(async (req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await wakesurfBookingService.confirmBooking(req.body);
});

const deleteAllBookings = lipslideCommon.asyncMiddleware(async(req) => {
	lipslideCommon.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await wakesurfBookingService.deleteAllBookings(req.params);
});

module.exports = {
	newBooking,
	confirmBooking,
	cancelBooking,
	fulfillBooking,
	findBooking,
	searchBookings,
	deleteAllBookings
}

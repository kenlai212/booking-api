"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const bookingService = require("./booking.service");
const bookingCommon = require("./booking.common");

const newBooking = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]);

	return await bookingService.addNewBooking(req.body, req.user);
});


const searchBookings = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [
		bookingCommon.BOOKING_ADMIN_GROUP
	]);

	const queryObject = url.parse(req.url, true).query;
	return await bookingService.viewBookings(queryObject, req.user);
});

const findBooking = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]);

	return await bookingService.findBookingById(req.params, req.user);
});

module.exports = {
	newBooking,
	searchBookings,
	findBooking
}

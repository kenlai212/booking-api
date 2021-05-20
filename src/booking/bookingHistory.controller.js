"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const bookingHistoryService = require("./bookingHistory.service");

const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";

const newBookingHistory = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	const input = req.body;
	input.requestorId = req.requestor.id;

	return await bookingHistoryService.newBookingHistory(input);
});

const findBookingHistory = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await bookingHistoryService.findBookingHistory(req.params);
});

const deleteAllBookingHistories = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.requestor.groups, [BOOKING_ADMIN_GROUP]);

	return await bookingHistoryService.deleteAllBookingHistories(req.params);
});

module.exports = {
	newBookingHistory,
	findBookingHistory,
	deleteAllBookingHistories
}
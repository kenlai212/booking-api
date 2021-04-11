"use strict";
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const bookingHistoryService = require("./bookingHistory.service");
const bookingHistoryRead = require("./bookingHistory.read");

const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";

const initBookingHistory = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [BOOKING_ADMIN_GROUP]);

	return await bookingHistoryService.initBookingHistory(req.body, req.user);
});

const addHistoryItem = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [BOOKING_ADMIN_GROUP]);

	return await bookingHistoryService.addHistoryItem(req.body, req.user);
});

const getBookingHistory = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [BOOKING_ADMIN_GROUP]);

	return await bookingHistoryRead.getBookingHistory(req.params, req.user);
});

module.exports = {
	initBookingHistory,
	addHistoryItem,
	getBookingHistory
}
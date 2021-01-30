"use strict";
const userAuthorization = require("../common/middleware/userAuthorization");

const bookingHistoryService = require("./bookingHistory.service");
const asyncMiddleware = require("../common/middleware/asyncMiddleware");

const BOOKING_ADMIN_GROUP = "BOOKING_ADMIN";

const initBookingHistory = asyncMiddleware(async (req) => {
	const rightsGroup = [BOOKING_ADMIN_GROUP]

	if (!userAuthorization(req.user.groups, rightsGroup))
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };

	return await bookingHistoryService.initBookingHistory(req.body, req.user);
});

const addHistoryItem = asyncMiddleware(async (req) => {
	const rightsGroup = [BOOKING_ADMIN_GROUP]

	if (!userAuthorization(req.user.groups, rightsGroup))
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };

	return await bookingHistoryService.addHistoryItem(req.body, req.user);
});

const getBookingHistory = asyncMiddleware(async (req) => {
	const rightsGroup = [BOOKING_ADMIN_GROUP]

	if (!userAuthorization(req.user.groups, rightsGroup))
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };

	return await bookingHistoryService.getBookingHistory(req.params, req.user);
});

module.exports = {
	initBookingHistory,
	addHistoryItem,
	getBookingHistory
}
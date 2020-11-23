"use strict";
const bookingHistoryService = require("./bookingHistory.service");
const asyncMiddleware = require("../common/middleware/asyncMiddleware");

const initBookingHistory = asyncMiddleware(async (req, res) => {
	return await bookingHistoryService.initBookingHistory(req.body, req.user);
});

const addHistoryItem = asyncMiddleware(async (req, res) => {
	return await bookingHistoryService.addHistoryItem(req.body, req.user);
});

const getBookingHistory = asyncMiddleware(async (req, res) => {
	return await bookingHistoryService.getBookingHistory(req.params, req.user);
});

module.exports = {
	initBookingHistory,
	addHistoryItem,
	getBookingHistory
}
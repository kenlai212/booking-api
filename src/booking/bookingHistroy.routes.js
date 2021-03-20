"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");

const bookingHistoryController = require("./bookingHistory.controller");

const router = express.Router();
router.get("/booking-history/:bookingId", authenticateAccessToken, logIncommingRequest, bookingHistoryController.getBookingHistory);
router.post("/booking-history", authenticateAccessToken, logIncommingRequest, bookingHistoryController.initBookingHistory);
router.post("/booking-history/history-item", authenticateAccessToken, logIncommingRequest, bookingHistoryController.addHistoryItem);

module.exports = router;
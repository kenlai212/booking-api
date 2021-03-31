"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");

const bookingController = require("./booking.controller");

const router = express.Router();
router.post("/book-now", authenticateAccessToken, logIncommingRequest, bookingController.bookNow);

router.get("/bookings", authenticateAccessToken, logIncommingRequest, bookingController.searchBookings);
router.get("/booking/:bookingId", authenticateAccessToken, logIncommingRequest, bookingController.findBooking);

router.put("/booking/status/confirm", authenticateAccessToken, logIncommingRequest, bookingController.confirmBooking);
router.put("/booking/status/cancel", authenticateAccessToken, logIncommingRequest, bookingController.cancelBooking);
router.put("/booking/status/fulfill", authenticateAccessToken, logIncommingRequest, bookingController.fulfillBooking);

module.exports = router;
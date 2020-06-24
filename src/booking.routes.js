"use strict";
const express = require("express");
const bookingController = require("./booking.controller");
const common = require("gogowake-common");

require('dotenv').config();

const router = express.Router();
router.post("/booking", authenticateAccessToken, bookingController.newBooking);
router.delete("/booking", authenticateAccessToken, bookingController.cancelBooking);
router.get("/bookings", authenticateAccessToken, bookingController.searchBookings);
router.get("/booking", authenticateAccessToken, bookingController.findBooking);
router.put("/fulfill-booking", authenticateAccessToken, bookingController.fulfillBooking);
router.put("/payment-status", authenticateAccessToken, bookingController.changePaymentStatus);
router.put("/add-guest", authenticateAccessToken, bookingController.addGuest);
router.put("/remove-guest", authenticateAccessToken, bookingController.removeGuest);
router.put("/add-crew", authenticateAccessToken, bookingController.addCrew);

module.exports = router;

function authenticateAccessToken(req, res, next) {
    req.user = common.authenticateAccessToken(req, res);
    next();
}
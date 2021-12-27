"use strict";
const express = require("express");
require("dotenv").config();

const lipslideCommon = require("lipslide-common");

const wakesurfBookingController = require("./wakesurfBooking/wakesurfBooking.controller");

const router = express.Router();
router.post(`${process.env.API_URL_PREFIX}/booking`, lipslideCommon.authenticateAccessToken, wakesurfBookingController.newBooking);
router.put(`${process.env.API_URL_PREFIX}/booking/status/confirm`, lipslideCommon.authenticateAccessToken, wakesurfBookingController.confirmBooking);
router.put(`${process.env.API_URL_PREFIX}/booking/status/cancel`, lipslideCommon.authenticateAccessToken, wakesurfBookingController.cancelBooking);
router.put(`${process.env.API_URL_PREFIX}/booking/status/fulfill`, lipslideCommon.authenticateAccessToken, wakesurfBookingController.fulfillBooking);
router.get(`${process.env.API_URL_PREFIX}/bookings`, lipslideCommon.authenticateAccessToken, wakesurfBookingController.searchBookings);
router.get(`${process.env.API_URL_PREFIX}/booking/:bookingId`, lipslideCommon.authenticateAccessToken, wakesurfBookingController.findBooking);
router.delete(`${process.env.API_URL_PREFIX}/bookings/:passcode`, lipslideCommon.authenticateAccessToken, wakesurfBookingController.deleteAllBookings);

module.exports = router;
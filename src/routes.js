"use strict";
const config = require('config');
const express = require("express");

const lipslideCommon = require("lipslide-common");

const wakesurfBookingController = require("./wakesurfBooking/wakesurfBooking.controller");

const router = express.Router();
router.post(`${config.get("api.prefix")}/booking`, lipslideCommon.authenticateAccessToken, wakesurfBookingController.newBooking);
router.put(`${config.get("api.prefix")}/booking/status/confirm`, lipslideCommon.authenticateAccessToken, wakesurfBookingController.confirmBooking);
router.put(`${config.get("api.prefix")}/booking/status/cancel`, lipslideCommon.authenticateAccessToken, wakesurfBookingController.cancelBooking);
router.put(`${config.get("api.prefix")}/booking/status/fulfill`, lipslideCommon.authenticateAccessToken, wakesurfBookingController.fulfillBooking);
router.get(`${config.get("api.prefix")}/bookings`, lipslideCommon.authenticateAccessToken, wakesurfBookingController.searchBookings);
router.get(`${config.get("api.prefix")}/booking/:bookingId`, lipslideCommon.authenticateAccessToken, wakesurfBookingController.findBooking);

module.exports = router;
"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");

const bookingController = require("./booking.controller");
const customerController = require("./customer.controller");

const router = express.Router();
router.post("/booking", authenticateAccessToken, logIncommingRequest, bookingController.newBooking);
router.put("/booking/status/confirm", authenticateAccessToken, logIncommingRequest, bookingController.confirmBooking);
router.put("/booking/status/cancel", authenticateAccessToken, logIncommingRequest, bookingController.cancelBooking);
router.put("/booking/status/fulfill", authenticateAccessToken, logIncommingRequest, bookingController.fulfillBooking);

router.get("/bookings", authenticateAccessToken, logIncommingRequest, bookingController.searchBookings);
router.get("/booking/:bookingId", authenticateAccessToken, logIncommingRequest, bookingController.findBooking);

router.delete("/bookings/:passcode", authenticateAccessToken, logIncommingRequest, bookingController.deleteAllBookings);

router.post("/booking/customer", authenticateAccessToken, logIncommingRequest, customerController.newCustomer);
router.delete("/booking/customers/:passcode", authenticateAccessToken, logIncommingRequest, customerController.deleteAllCustomers);

module.exports = router;
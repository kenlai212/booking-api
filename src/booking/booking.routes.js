"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");

const bookingController = require("./booking.controller");
const paymentController = require("./booking.payment.controller");
const guestController = require("./booking.guest.controller");
const crewController = require("./booking.crew.controller");

const router = express.Router();
router.post("/booking", authenticateAccessToken, logIncommingRequest, bookingController.newBooking);
router.delete("/booking", authenticateAccessToken, logIncommingRequest, bookingController.cancelBooking);
router.get("/bookings", authenticateAccessToken, logIncommingRequest, bookingController.searchBookings);
router.get("/booking", authenticateAccessToken, logIncommingRequest, bookingController.findBooking);
router.put("/booking/fulfill", authenticateAccessToken, logIncommingRequest, bookingController.fulfillBooking);
router.put("/booking/contact", authenticateAccessToken, logIncommingRequest, bookingController.editContact);

router.post("/booking/crew", authenticateAccessToken, logIncommingRequest, crewController.addCrew);

router.put("/booking/payment", authenticateAccessToken, logIncommingRequest, paymentController.makePayment);
router.put("/booking/discount", authenticateAccessToken, logIncommingRequest, paymentController.applyDiscount);

router.delete("/booking/guest", authenticateAccessToken, logIncommingRequest, guestController.removeGuest);
router.post("/booking/guest", authenticateAccessToken, logIncommingRequest, guestController.addGuest);
router.put("/booking/guest", authenticateAccessToken, logIncommingRequest, guestController.editGuest);
router.put("/booking/guest/disclaimer/notification", authenticateAccessToken, logIncommingRequest, guestController.sendDisclaimer);
router.put("/booking/guest/disclaimer", logIncommingRequest, guestController.signDisclaimer);

module.exports = router;
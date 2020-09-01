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
router.put("/fulfill-booking", authenticateAccessToken, logIncommingRequest, bookingController.fulfillBooking);
router.put("/edit-contact", authenticateAccessToken, logIncommingRequest, bookingController.editContact);

router.put("/add-crew", authenticateAccessToken, logIncommingRequest, crewController.addCrew);

router.put("/make-payment", authenticateAccessToken, logIncommingRequest, paymentController.makePayment);
router.put("/apply-discount", authenticateAccessToken, logIncommingRequest, paymentController.applyDiscount);

router.put("/remove-guest", authenticateAccessToken, logIncommingRequest, guestController.removeGuest);
router.put("/add-guest", authenticateAccessToken, logIncommingRequest, guestController.addGuest);
router.post("/send-disclaimer", authenticateAccessToken, logIncommingRequest, guestController.sendDisclaimer);
router.put("/edit-guest", authenticateAccessToken, logIncommingRequest, guestController.editGuest);
router.post("/sign-disclaimer", logIncommingRequest, guestController.signDisclaimer);

module.exports = router;
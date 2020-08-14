"use strict";
const express = require("express");
const bookingController = require("./booking.controller");
const paymentController = require("./payment.controller");
const guestController = require("./guest.controller");
const crewController = require("./crew.controller");
const gogowakeCommon = require("gogowake-common");

require('dotenv').config();

const router = express.Router();
router.post("/booking", authenticateAccessToken, bookingController.newBooking);
router.delete("/booking", authenticateAccessToken, bookingController.cancelBooking);
router.get("/bookings", authenticateAccessToken, bookingController.searchBookings);
router.get("/booking", authenticateAccessToken, bookingController.findBooking);
router.put("/fulfill-booking", authenticateAccessToken, bookingController.fulfillBooking);
router.put("/edit-contact", authenticateAccessToken, bookingController.editContact);

router.put("/add-crew", authenticateAccessToken, crewController.addCrew);

router.put("/make-payment", authenticateAccessToken, paymentController.makePayment);
router.put("/apply-discount", authenticateAccessToken, paymentController.applyDiscount);

router.put("/remove-guest", authenticateAccessToken, guestController.removeGuest);
router.put("/add-guest", authenticateAccessToken, guestController.addGuest);
router.post("/send-disclaimer", authenticateAccessToken, guestController.sendDisclaimer);
router.put("/edit-guest", authenticateAccessToken, guestController.editGuest);
router.post("/sign-disclaimer", guestController.signDisclaimer);

module.exports = router;

function authenticateAccessToken(req, res, next) {
    req.user = gogowakeCommon.authenticateAccessToken(req, res);
    next();
}
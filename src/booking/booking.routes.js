"use strict";
const express = require("express");
const bookingController = require("./booking.controller");
const paymentController = require("./booking.payment.controller");
const guestController = require("./booking.guest.controller");
const crewController = require("./booking.crew.controller");

const router = express.Router();
router.post("/booking", logIncommingRequest, authenticateAccessToken, bookingController.newBooking);
router.delete("/booking", logIncommingRequest, authenticateAccessToken, bookingController.cancelBooking);
router.get("/bookings", logIncommingRequest, authenticateAccessToken, bookingController.searchBookings);
router.get("/booking", logIncommingRequest, authenticateAccessToken, bookingController.findBooking);
router.put("/fulfill-booking", logIncommingRequest, authenticateAccessToken, bookingController.fulfillBooking);
router.put("/edit-contact", logIncommingRequest, authenticateAccessToken, bookingController.editContact);

router.put("/add-crew", logIncommingRequest, authenticateAccessToken, crewController.addCrew);

router.put("/make-payment", logIncommingRequest, authenticateAccessToken, paymentController.makePayment);
router.put("/apply-discount", logIncommingRequest, authenticateAccessToken, paymentController.applyDiscount);

router.put("/remove-guest", logIncommingRequest, authenticateAccessToken, guestController.removeGuest);
router.put("/add-guest", logIncommingRequest, authenticateAccessToken, guestController.addGuest);
router.post("/send-disclaimer", logIncommingRequest, authenticateAccessToken, guestController.sendDisclaimer);
router.put("/edit-guest", logIncommingRequest, authenticateAccessToken, guestController.editGuest);
router.post("/sign-disclaimer", logIncommingRequest, guestController.signDisclaimer);

module.exports = router;
"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");

const bookingController = require("./booking.controller");
const invoiceController = require("./invoice/booking.invoice.controller");
const guestController = require("./guest/booking.guest.controller");
const disclaimerController = require("./guest/booking.guest.disclaimer.controller");
const crewController = require("./crew/booking.crew.controller");
const hostController = require("./host/booking.host.controller");

const router = express.Router();
router.post("/booking", authenticateAccessToken, logIncommingRequest, bookingController.newBooking);
router.put("/booking/status/cancel", authenticateAccessToken, logIncommingRequest, bookingController.cancelBooking);
router.get("/bookings", authenticateAccessToken, logIncommingRequest, bookingController.searchBookings);
router.get("/booking/:bookingId", authenticateAccessToken, logIncommingRequest, bookingController.findBooking);
router.put("/booking/status/fulfill", authenticateAccessToken, logIncommingRequest, bookingController.fulfillBooking);

router.put("/booking/host", authenticateAccessToken, logIncommingRequest, hostController.editHost);

router.post("/booking/crew", authenticateAccessToken, logIncommingRequest, crewController.assignCrew);
router.delete("/booking/crew/:bookingId/:crewId", authenticateAccessToken, logIncommingRequest, crewController.relieveCrew);

router.put("/booking/payment", authenticateAccessToken, logIncommingRequest, invoiceController.makePayment);
router.put("/booking/discount", authenticateAccessToken, logIncommingRequest, invoiceController.applyDiscount);
router.delete("/booking/discount/:bookingId/:discountId", authenticateAccessToken, logIncommingRequest, invoiceController.removeDiscount);

router.delete("/booking/guest/:bookingId/:guestId", authenticateAccessToken, logIncommingRequest, guestController.removeGuest);
router.post("/booking/guest", authenticateAccessToken, logIncommingRequest, guestController.addGuest);
router.put("/booking/guest", authenticateAccessToken, logIncommingRequest, guestController.editGuest);

router.put("/booking/guest/disclaimer/notification", authenticateAccessToken, logIncommingRequest, disclaimerController.sendDisclaimerNotification);
router.put("/booking/guest/disclaimer", logIncommingRequest, disclaimerController.signDisclaimer);

module.exports = router;
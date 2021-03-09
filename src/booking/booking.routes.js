"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");

const bookingController = require("./booking.controller");
const hostController = require("./host/booking.host.controller");
const crewController = require("./crew/booking.crew.controller");
const statusController = require("./status/booking.status.controller");

const router = express.Router();
router.post("/book-now", authenticateAccessToken, logIncommingRequest, bookingController.bookNow);

router.get("/bookings", authenticateAccessToken, logIncommingRequest, bookingController.searchBookings);
router.get("/booking/:bookingId", authenticateAccessToken, logIncommingRequest, bookingController.findBooking);

router.post("/booking", authenticateAccessToken, logIncommingRequest, statusController.initBooking);
router.put("/booking/status/confirm", authenticateAccessToken, logIncommingRequest, statusController.confirmBooking);
router.put("/booking/status/cancel", authenticateAccessToken, logIncommingRequest, statusController.cancelBooking);
router.put("/booking/status/fulfill", authenticateAccessToken, logIncommingRequest, statusController.fulfillBooking);

router.post("/booking/crew", authenticateAccessToken, logIncommingRequest, crewController.assignCrew);
router.delete("/booking/crew/:bookingId/:crewId", authenticateAccessToken, logIncommingRequest, crewController.relieveCrew);

router.post("/booking/host", authenticateAccessToken, logIncommingRequest, hostController.addHost);

module.exports = router;
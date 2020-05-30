"use strict";
const jwt = require("jsonwebtoken");
const express = require("express");
const bookingController = require("./booking.controller");
const logger = require("./logger");

const router = express.Router();
router.post("/booking", authenticateToken, bookingController.newBooking);
router.delete("/booking", authenticateToken, bookingController.cancelBooking);
router.get("/bookings", authenticateToken, bookingController.searchBookings);
router.get("/booking", authenticateToken, bookingController.findBooking);
router.put("/payment-status", authenticateToken, bookingController.changePaymentStatus);
router.put("/add-guest", authenticateToken, bookingController.addGuest);
router.put("/remove-guest", authenticateToken, bookingController.removeGuest);
router.put("/add-crew", authenticateToken, bookingController.addCrew);

function authenticateToken(req, res, next) {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];

	if (token == null) {
		return res.sendStatus(401);
	}

	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
		if (err) {
			logger.error("Error while verifying accessToken, running jwt.verify() : " + err);
			return res.sendStatus(403);
		}

		req.user = user;

		next();
	});

}

module.exports = router;

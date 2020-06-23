"use strict";
const express = require("express");
const jwt = require("jsonwebtoken");
const bookingController = require("./booking.controller");

require('dotenv').config();

const router = express.Router();
router.post("/booking", authenticateAccessToken, bookingController.newBooking);
router.delete("/booking", authenticateAccessToken, bookingController.cancelBooking);
router.get("/bookings", authenticateAccessToken, bookingController.searchBookings);
router.get("/booking", authenticateAccessToken, bookingController.findBooking);
router.put("/fulfill-booking", authenticateAccessToken, bookingController.fulfillBooking);
router.put("/payment-status", authenticateAccessToken, bookingController.changePaymentStatus);
router.put("/add-guest", authenticateAccessToken, bookingController.addGuest);
router.put("/remove-guest", authenticateAccessToken, bookingController.removeGuest);
router.put("/add-crew", authenticateAccessToken, bookingController.addCrew);

module.exports = router;

function authenticateAccessToken(req, res, next) {
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
        req.user.accessToken = token;

        next();
    });

}
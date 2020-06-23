"use strict";
const express = require("express");
const jwt = require("jsonwebtoken");
const pricingController = require("./pricing.controller");
const router = express.Router();

require('dotenv').config();

router.get("/total-amount", authenticateAccessToken, pricingController.totalAmount);

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

        next();
    });

}
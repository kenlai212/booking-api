"use strict";
const express = require("express");
const jwt = require("jsonwebtoken");
const slotController = require("./slot.controller");
const router = express.Router();

require('dotenv').config();

router.get("/slots", authenticateAccessToken, slotController.slots);
router.get("/end-slots", authenticateAccessToken, slotController.endSlots);

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
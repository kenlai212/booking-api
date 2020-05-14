"use strict";
const jwt = require("jsonwebtoken");
const express = require("express");
const slotController = require("./slot.controller");
const logger = require("./logger");
const router = express.Router();

router.get("/slots", authenticateToken, slotController.slots);
router.get("/end-slots", authenticateToken, slotController.endSlots);

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

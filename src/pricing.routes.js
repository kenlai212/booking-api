"use strict";
const jwt = require("jsonwebtoken");
const express = require("express");
const pricingController = require("./pricing.controller");

const router = express.Router();

router.get("/total-amount", authenticateToken, pricingController.totalAmount);

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

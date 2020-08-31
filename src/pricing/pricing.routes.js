"use strict";
const express = require("express");
const pricingController = require("./pricing.controller");

const logIncommingRequest = require("../middleware/logIncommingRequest");
const authenticateAccessToken = require("../middleware/authenticateAccessToken");

const router = express.Router();
router.get("/total-amount", authenticateAccessToken, logIncommingRequest, pricingController.totalAmount);

module.exports = router;
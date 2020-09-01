"use strict";
const express = require("express");
const pricingController = require("./pricing.controller");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");

const router = express.Router();
router.get("/total-amount", authenticateAccessToken, logIncommingRequest, pricingController.totalAmount);

module.exports = router;
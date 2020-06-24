"use strict";
const express = require("express");
const pricingController = require("./pricing.controller");
const router = express.Router();
const common = require("gogowake-common");

require('dotenv').config();

router.get("/total-amount", authenticateAccessToken, pricingController.totalAmount);

module.exports = router;

function authenticateAccessToken(req, res, next) {
    req.user = common.authenticateAccessToken(req, res);
    next();
}
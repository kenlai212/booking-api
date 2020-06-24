"use strict";
const express = require("express");
const slotController = require("./slot.controller");
const router = express.Router();
const common = require("gogowake-common");

require('dotenv').config();

router.get("/slots", authenticateAccessToken, slotController.slots);
router.get("/end-slots", authenticateAccessToken, slotController.endSlots);

module.exports = router;

function authenticateAccessToken(req, res, next) {
    req.user = common.authenticateAccessToken(req, res);
    next();
}
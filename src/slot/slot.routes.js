"use strict";
const express = require("express");
const slotController = require("./slot.controller");

const logIncommingRequest = require("../middleware/logIncommingRequest");
const authenticateAccessToken = require("../middleware/authenticateAccessToken");

const router = express.Router();
router.get("/slots", logIncommingRequest, authenticateAccessToken, slotController.slots);
router.get("/end-slots", logIncommingRequest, authenticateAccessToken, slotController.endSlots);

module.exports = router;
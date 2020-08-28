"use strict";
const express = require("express");
const controller = require("./occupancy.controller");

const logIncommingRequest = require("../middleware/logIncommingRequest");
const authenticateAccessToken = require("../middleware/authenticateAccessToken");

const router = express.Router();
router.get("/occupancies", authenticateAccessToken, logIncommingRequest, controller.getOccupancies);
router.post("/occupancy", authenticateAccessToken, logIncommingRequest, controller.newOccupancy);
router.get("/availability", authenticateAccessToken, logIncommingRequest, controller.availability);
router.delete("/occupancy", authenticateAccessToken, logIncommingRequest, controller.cancelOccupancy);

module.exports = router;




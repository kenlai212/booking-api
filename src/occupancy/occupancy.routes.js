"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const controller = require("./occupancy.controller");

const router = express.Router();
router.get("/occupancies", authenticateAccessToken, logIncommingRequest, controller.getOccupancies);
router.post("/occupancy", authenticateAccessToken, logIncommingRequest, controller.occupyAsset);
router.delete("/occupancy/:bookingId/:bookingType", authenticateAccessToken, logIncommingRequest, controller.releaseOccupancy);

module.exports = router;




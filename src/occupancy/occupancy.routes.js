"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const controller = require("./occupancy.controller");

const router = express.Router();
router.get("/occupancies", authenticateAccessToken, logIncommingRequest, controller.getOccupancies);
router.post("/occupancy", authenticateAccessToken, logIncommingRequest, controller.newOccupancy);
router.put("/occupancy/bookingId", authenticateAccessToken, logIncommingRequest, controller.updateBookingId);
router.get("/availability", authenticateAccessToken, logIncommingRequest, controller.availability);
router.delete("/occupancy/:bookingId/:bookingType", authenticateAccessToken, logIncommingRequest, controller.releaseOccupancy);

module.exports = router;




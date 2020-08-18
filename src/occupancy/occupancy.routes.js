"use strict";
const express = require("express");
const controller = require("./occupancy.controller");

const logIncommingRequest = require("../middleware/logIncommingRequest");
const logOutgoingResponse = require("../middleware/logOutgoingResponse");
const authenticateAccessToken = require("../middleware/authenticateAccessToken");

const router = express.Router();
router.get("/occupancies", authenticateAccessToken, logIncommingRequest, controller.getOccupancies, logOutgoingResponse);
router.post("/occupancy", authenticateAccessToken, logIncommingRequest, controller.newOccupancy, logOutgoingResponse);
router.get("/availability", authenticateAccessToken, logIncommingRequest, controller.availability, logOutgoingResponse);
router.delete("/occupancy", authenticateAccessToken, logIncommingRequest, controller.cancelOccupancy, logOutgoingResponse);

module.exports = router;




"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const controller = require("./occupancy.controller");

const router = express.Router();

router.post("/occupancy", authenticateAccessToken, logIncommingRequest, controller.occupyAsset);
router.delete("/occupancy/:occupancyId", authenticateAccessToken, logIncommingRequest, controller.releaseOccupancy);
router.put("/occupancy/confirm", authenticateAccessToken, logIncommingRequest, controller.confirmOccupancy);

router.get("/occupancies", authenticateAccessToken, logIncommingRequest, controller.getOccupancies);

module.exports = router;




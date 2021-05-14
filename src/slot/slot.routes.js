"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");

const slotController = require("./slot.controller");
const occupancyController = require("./occupancy.controller");

const router = express.Router();
router.get("/slots", logIncommingRequest, authenticateAccessToken, slotController.slots);
router.get("/end-slots", logIncommingRequest, authenticateAccessToken, slotController.endSlots);

router.post("/slot/occupancy", logIncommingRequest, authenticateAccessToken, occupancyController.newOccupancy);
router.delete("/slot/occupancy/:occupancyId", logIncommingRequest, authenticateAccessToken, occupancyController.deleteOccupancy);
router.post("/slot/occupancies/:passcode", logIncommingRequest, authenticateAccessToken, occupancyController.deleteAllOccupancies);

module.exports = router;
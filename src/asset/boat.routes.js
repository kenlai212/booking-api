"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const boatController = require("./boat.controller");

const router = express.Router();
router.post("/boat", logIncommingRequest, authenticateAccessToken, boatController.newBoat);
router.put("/boat/fuel-percentage", logIncommingRequest, authenticateAccessToken, boatController.setFuelPercentage);

module.exports = router;
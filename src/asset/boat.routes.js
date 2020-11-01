"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const boatController = require("./boat.controller");

const router = express.Router();
router.post("/boat", logIncommingRequest, authenticateAccessToken, boatController.newBoat);
router.get("/boat/:assetId", logIncommingRequest, authenticateAccessToken, boatController.findBoat);
router.put("/boat/fuel-level", logIncommingRequest, authenticateAccessToken, boatController.setFuelLevel);

module.exports = router;
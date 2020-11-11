"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const boatController = require("./boat.controller");
const fuelReserviorController = require("./fuelResevior.controller");

const router = express.Router();
router.post("/boat", logIncommingRequest, authenticateAccessToken, boatController.newBoat);
router.get("/boat/:assetId", logIncommingRequest, authenticateAccessToken, boatController.findBoat);
router.put("/boat/fuel-level", logIncommingRequest, authenticateAccessToken, boatController.setFuelLevel);

router.post("/fuel-reservior", logIncommingRequest, authenticateAccessToken, fuelReserviorController.newFuelReservior);
router.put("/fuel-reservior", logIncommingRequest, authenticateAccessToken, fuelReserviorController.editCanisters);
router.get("/fuel-reservior/:assetId", logIncommingRequest, authenticateAccessToken, fuelReserviorController.findFuelReservior);

module.exports = router;
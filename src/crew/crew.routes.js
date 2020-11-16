"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const crewController = require("./crew.controller");

const router = express.Router();
router.post("/crew", logIncommingRequest, authenticateAccessToken, crewController.newCrew);
router.get("/crews", logIncommingRequest, authenticateAccessToken, crewController.searchCrews);
router.get("/crew/:crewId", logIncommingRequest, authenticateAccessToken, crewController.findCrew);
router.delete("/crew/:crewId", logIncommingRequest, authenticateAccessToken, crewController.deleteCrew);

module.exports = router;

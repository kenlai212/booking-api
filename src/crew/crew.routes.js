"use strict";
const express = require("express");
const crewController = require("./crew.controller");

const router = express.Router();
router.post("/crew", logIncommingRequest, authenticateAccessToken, crewController.newCrew);
router.get("/crews", logIncommingRequest, authenticateAccessToken, crewController.searchCrews);
router.get("/crew", logIncommingRequest, authenticateAccessToken, crewController.findCrew);

module.exports = router;

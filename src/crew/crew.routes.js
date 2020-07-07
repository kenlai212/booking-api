"use strict";
const express = require("express");
const crewController = require("./crew.controller");
const common = require("gogowake-common");

require('dotenv').config();

const router = express.Router();
router.post("/crew", authenticateAccessToken, crewController.newCrew);
router.get("/crews", authenticateAccessToken, crewController.searchCrews);
router.get("/crew", authenticateAccessToken, crewController.findCrew);

module.exports = router;

function authenticateAccessToken(req, res, next) {
    req.user = common.authenticateAccessToken(req, res);
    next();
}

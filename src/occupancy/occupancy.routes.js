"use strict";
const express = require("express");
const controller = require("./occupancy.controller");
const common = require("gogowake-common");

require('dotenv').config();

const router = express.Router();
router.get("/occupancies", authenticateAccessToken, controller.getOccupancies);
router.post("/occupancy", authenticateAccessToken, controller.newOccupancy);
router.get("/availability", authenticateAccessToken, controller.availability);
router.delete("/occupancy", authenticateAccessToken, controller.cancelOccupancy);

module.exports = router;

function authenticateAccessToken(req, res, next) {
    req.user = common.authenticateAccessToken(req, res);
    next();
}
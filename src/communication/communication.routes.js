"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const communicationController = require("./communication.controller");

const router = express.Router();
router.post("/email", authenticateAccessToken, logIncommingRequest, communicationController.email);
router.post("/sms", authenticateAccessToken, logIncommingRequest, communicationController.sms);

module.exports = router;
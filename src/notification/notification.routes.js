"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const notificationController = require("./notification.controller");

const router = express.Router();
router.post("/email", authenticateAccessToken, logIncommingRequest, notificationController.email);
router.post("/sms", authenticateAccessToken, logIncommingRequest, notificationController.sms);

module.exports = router;

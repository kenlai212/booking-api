"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticationController = require("./authentication.controller");

const router = express.Router();
router.get("/loginId", logIncommingRequest, authenticationController.checkLoginIdAvailability);
router.post("/credentials", logIncommingRequest, authenticationController.addNewCredentials);
router.post("/login", logIncommingRequest, authenticationController.login);
router.post("/logout", logIncommingRequest, authenticationController.logout);

module.exports = router;

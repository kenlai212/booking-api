"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticationController = require("./authentication.controller");

const router = express.Router();

router.post("/login/social", logIncommingRequest, authenticationController.socialLogin);

module.exports = router;

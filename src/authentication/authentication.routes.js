"use strict";
const express = require("express");
const authenticationController = require("./authentication.controller");

const router = express.Router();
router.get("/loginId", authenticationController.checkLoginIdAvailability);
router.post("/credentials", authenticationController.addNewCredentials);
router.post("/login", authenticationController.login);
router.post("/token", authenticationController.getNewAccessToken);
router.post("/logout", authenticationController.logout);

module.exports = router;

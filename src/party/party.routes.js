"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const controller = require("./party.controller");

const router = express.Router();
router.post("/party", authenticateAccessToken, logIncommingRequest, controller.createNewParty);
router.get("/parties", authenticateAccessToken, logIncommingRequest, controller.searchParty);
router.get("/party/:partyId", authenticateAccessToken, logIncommingRequest, controller.getParty);
router.delete("/party/:partyId", authenticateAccessToken, logIncommingRequest, controller.deleteParty);
router.put("/party/profile", authenticateAccessToken, logIncommingRequest, controller.editProfile);

module.exports = router;
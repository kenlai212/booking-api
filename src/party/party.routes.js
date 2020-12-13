"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const controller = require("./party.controller");

const router = express.Router();
router.post("/party", authenticateAccessToken, logIncommingRequest, controller.createNewParty);
router.get("/parties", authenticateAccessToken, logIncommingRequest, controller.searchParty);
router.get("/party/:partyId", authenticateAccessToken, logIncommingRequest, controller.findParty);
router.delete("/party/:partyId", authenticateAccessToken, logIncommingRequest, controller.deleteParty);
router.put("/party/personal-info", authenticateAccessToken, logIncommingRequest, controller.editPersonalInfo);
router.put("/party/contact", authenticateAccessToken, logIncommingRequest, controller.editContact);
router.put("/party/picture", authenticateAccessToken, logIncommingRequest, controller.editPicture);

module.exports = router;
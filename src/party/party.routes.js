"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const controller = require("./party.controller");

const router = express.Router();
router.post("/new-party", authenticateAccessToken, logIncommingRequest, controller.createNewParty);
router.post("/edit-party-personal-info", authenticateAccessToken, logIncommingRequest, controller.editPersonalInfo);
router.post("/edit-party-contact", authenticateAccessToken, logIncommingRequest, controller.editContact);
router.post("/edit-party-picture", authenticateAccessToken, logIncommingRequest, controller.editPicture);

router.post("/party",authenticateAccessToken, logIncommingRequest, controller.createParty);
router.get("/parties", authenticateAccessToken, logIncommingRequest, controller.readParties);
router.get("/party/:partyId", authenticateAccessToken, logIncommingRequest, controller.readParty);
router.put("/party", authenticateAccessToken, logIncommingRequest, controller.updateParty);
router.delete("/party/:partyId", authenticateAccessToken, logIncommingRequest, controller.deleteParty);

module.exports = router;
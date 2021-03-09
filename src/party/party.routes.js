"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const controller = require("./party.controller");

const router = express.Router();
router.post("/party", authenticateAccessToken, logIncommingRequest, controller.createNewParty);
router.put("/party/personal-info", authenticateAccessToken, logIncommingRequest, controller.editPersonalInfo);
router.put("/party/contact", authenticateAccessToken, logIncommingRequest, controller.editContact);
router.put("/party/picture", authenticateAccessToken, logIncommingRequest, controller.editPicture);
router.put("/party/role/add", authenticateAccessToken, logIncommingRequest, controller.addRole);
router.put("/party/role/remove", authenticateAccessToken, logIncommingRequest, controller.removeRole);
router.put("/party/preferred-contact-method", authenticateAccessToken, logIncommingRequest, controller.changePreferredContactMethod);
router.post("/party/message", authenticateAccessToken, logIncommingRequest, controller.sendMessage);
router.post("/party/registration-invite", authenticateAccessToken, logIncommingRequest, controller.sendRegistrationInvite);
router.delete("/party/:partyId", authenticateAccessToken, logIncommingRequest, controller.deleteParty);

router.get("/parties", authenticateAccessToken, logIncommingRequest, controller.readParties);
router.get("/party/:partyId", authenticateAccessToken, logIncommingRequest, controller.readParty);


module.exports = router;
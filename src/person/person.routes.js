"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const controller = require("./party.controller");

const router = express.Router();
router.post("/person", authenticateAccessToken, logIncommingRequest, controller.createNewPerson);
router.put("/person/personal-info", authenticateAccessToken, logIncommingRequest, controller.editPersonalInfo);
router.put("/person/contact", authenticateAccessToken, logIncommingRequest, controller.editContact);
router.put("/person/picture", authenticateAccessToken, logIncommingRequest, controller.editPicture);
router.put("/person/role/add", authenticateAccessToken, logIncommingRequest, controller.addRole);
router.put("/person/role/remove", authenticateAccessToken, logIncommingRequest, controller.removeRole);
router.put("/person/preferred-contact-method", authenticateAccessToken, logIncommingRequest, controller.changePreferredContactMethod);
router.post("/person/message", authenticateAccessToken, logIncommingRequest, controller.sendMessage);
router.post("/person/registration-invite", authenticateAccessToken, logIncommingRequest, controller.sendRegistrationInvite);
router.delete("/person/:partyId", authenticateAccessToken, logIncommingRequest, controller.deletePerson);

router.get("/persons", authenticateAccessToken, logIncommingRequest, controller.readPersons);
router.get("/person/:personId", authenticateAccessToken, logIncommingRequest, controller.readPerson);

module.exports = router;
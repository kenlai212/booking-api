"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const controller = require("./person.controller");

const router = express.Router();
router.post("/person", authenticateAccessToken, logIncommingRequest, controller.newPerson);
router.delete("/person/:personId", authenticateAccessToken, logIncommingRequest, controller.deletePerson);
router.put("/person/name", authenticateAccessToken, logIncommingRequest, controller.updateName);
router.put("/person/dob", authenticateAccessToken, logIncommingRequest, controller.updateDob);
router.put("/person/gender", authenticateAccessToken, logIncommingRequest, controller.updateGender);
router.put("/person/emailAddress", authenticateAccessToken, logIncommingRequest, controller.updateEmailAddress);
router.put("/person/mobile", authenticateAccessToken, logIncommingRequest, controller.updateMobile);
router.put("/person/profile-picture", authenticateAccessToken, logIncommingRequest, controller.updateProfilePicture);
router.put("/person/roles", authenticateAccessToken, logIncommingRequest, controller.updateRoles);
router.put("/person/preferred-contact-method", authenticateAccessToken, logIncommingRequest, controller.updatePreferredContactMethod);
router.put("/person/preferred-language", authenticateAccessToken, logIncommingRequest, controller.updatePreferredLanguage);

router.post("/person/message", authenticateAccessToken, logIncommingRequest, controller.sendMessage);
router.post("/person/registration-invite", authenticateAccessToken, logIncommingRequest, controller.sendRegistrationInvite);

router.get("/persons", authenticateAccessToken, logIncommingRequest, controller.readPersons);
router.get("/person/:personId", authenticateAccessToken, logIncommingRequest, controller.readPerson);

module.exports = router;
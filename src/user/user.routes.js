"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");

const userController = require("./user.controller");
const personController = require("./person.controller");

const router = express.Router();
router.post("/user/social", logIncommingRequest, userController.invitedSocialRegister);
router.post("/user", logIncommingRequest, userController.invitedRegister);
router.get("/user/:userId", authenticateAccessToken, logIncommingRequest, userController.findUser);
router.get("/users", authenticateAccessToken, logIncommingRequest, userController.searchUsers);
router.put("/user/group", authenticateAccessToken, logIncommingRequest, userController.assignGroup);
router.put("/user/group/unassign", authenticateAccessToken, logIncommingRequest, userController.unassignGroup);
router.get("/user/groups", authenticateAccessToken, logIncommingRequest, userController.searchGroups);
router.post("/user/activation-messaage", authenticateAccessToken, logIncommingRequest, userController.resendActivationMessage);
router.post("/user/registration-invite", authenticateAccessToken, logIncommingRequest, userController.sendRegistrationInvite);
router.put("/user/activate", logIncommingRequest, userController.activate);
router.delete("/user/:userId", authenticateAccessToken, logIncommingRequest, userController.deleteUser);
router.delete("/users/:passcode", authenticateAccessToken, logIncommingRequest, userController.deleteAllUsers);

router.post("/user/person", authenticateAccessToken, logIncommingRequest, personController.newPerson);
router.get("/user/person/:personId", authenticateAccessToken, logIncommingRequest, personController.getPerson);
router.delete("/user/person/:personId", authenticateAccessToken, logIncommingRequest, personController.deletePerson);
router.delete("/user/people/:passcode", authenticateAccessToken, logIncommingRequest, personController.deleteAllPeople);

module.exports = router;
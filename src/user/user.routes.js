"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");

const userController = require("./user.controller");
const registrationController = require("./registration.controller");

const router = express.Router();
router.post("/user/social", logIncommingRequest, registrationController.invitedSocialRegister);
router.post("/user", logIncommingRequest, registrationController.invitedRegister);

router.post("/user/activation-email", authenticateAccessToken, logIncommingRequest, userController.resendActivationEmail);
router.get("/users", authenticateAccessToken, logIncommingRequest, userController.searchUsers);
router.put("/user/groups", authenticateAccessToken, logIncommingRequest, userController.assignGroup);
router.delete("/user/groups/:userId/:groupId", authenticateAccessToken, logIncommingRequest, userController.unassignGroup);
router.delete("/user/:userId", authenticateAccessToken, logIncommingRequest, userController.deleteUser);
router.get("/groups", authenticateAccessToken, logIncommingRequest, userController.searchGroups);

router.get("/user/:id", authenticateAccessToken, logIncommingRequest, userController.findUser);
router.get("/user/social", authenticateAccessToken, logIncommingRequest, userController.findSocialUser);
router.put("/user/activate", logIncommingRequest, userController.activate);
router.put("/user/last-login", logIncommingRequest, userController.updateLastLogin);

module.exports = router;
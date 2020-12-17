"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const userController = require("./user.controller");
const registrationController = require("./registration.controller");
const adminController = require("./admin.controller");

const router = express.Router();
router.post("/user/social", logIncommingRequest, registrationController.socialRegister);

router.put("/user/status/admin", authenticateAccessToken, logIncommingRequest, adminController.editStatus);
router.post("/user/activation-email", authenticateAccessToken, logIncommingRequest, adminController.resendActivationEmail);
router.get("/users", authenticateAccessToken, logIncommingRequest, adminController.searchUsers);
router.put("/user/groups", authenticateAccessToken, logIncommingRequest, adminController.assignGroup);
router.delete("/user/groups/:userId/:groupId", authenticateAccessToken, logIncommingRequest, adminController.unassignGroup);
router.delete("/user/:userId", authenticateAccessToken, logIncommingRequest, adminController.deleteUser);
router.get("/groups", authenticateAccessToken, logIncommingRequest, adminController.searchGroups);

router.get("/user", authenticateAccessToken, logIncommingRequest, userController.findUser);
router.get("/user/social", authenticateAccessToken, logIncommingRequest, userController.findSocialUser);
router.put("/user/activate", logIncommingRequest, userController.activate);
router.put("/user/last-login", logIncommingRequest, userController.updateLastLogin);

module.exports = router;
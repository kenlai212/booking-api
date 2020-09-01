"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const userController = require("./user.controller");

const router = express.Router();
router.put("/activate", logIncommingRequest, userController.activate);
router.post("/register", logIncommingRequest, userController.register);

router.put("/deactivate", authenticateAccessToken, logIncommingRequest, userController.deactivate);
router.put("/admin-activate", authenticateAccessToken, logIncommingRequest, userController.adminActivate);

router.post("/activation-email", authenticateAccessToken, logIncommingRequest, userController.activateEmail);
router.get("/users", authenticateAccessToken, logIncommingRequest, userController.searchUsers);
router.get("/user", authenticateAccessToken, logIncommingRequest, userController.findUser);
router.put("/email-address", authenticateAccessToken, logIncommingRequest, userController.updateEmailAddress);
router.put("/groups", authenticateAccessToken, logIncommingRequest, userController.assignGroup);

module.exports = router;
"use strict";
const express = require("express");
const userController = require("./user.controller");
const common = require("gogowake-common");

const router = express.Router();
router.put("/activate", userController.activate);
router.post("/register", userController.register);

router.put("/deactivate", authenticateAccessToken, userController.deactivate);
router.put("/admin-activate", authenticateAccessToken, userController.adminActivate);

router.post("/activation-email", authenticateAccessToken, userController.activateEmail);
router.get("/users", authenticateAccessToken, userController.searchUsers);
router.get("/user", authenticateAccessToken, userController.findUser);
router.put("/email-address", authenticateAccessToken, userController.updateEmailAddress);
router.put("/groups", authenticateAccessToken, userController.assignGroup);

module.exports = router;

function authenticateAccessToken(req, res, next) {
    req.user = common.authenticateAccessToken(req, res);
    next();
}
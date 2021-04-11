"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const staffController = require("./staff.controller");

const router = express.Router();
router.post("/staff", logIncommingRequest, authenticateAccessToken, staffController.createStaff);
router.delete("/staff/:staffId", logIncommingRequest, authenticateAccessToken, staffController.deleteStaff);
router.put("/staff/status", logIncommingRequest, authenticateAccessToken, staffController.updateStatus);

router.get("/staffs", logIncommingRequest, authenticateAccessToken, staffController.searchStaffs);
router.get("/staff/:id", logIncommingRequest, authenticateAccessToken, staffController.findStaff);

module.exports = router;
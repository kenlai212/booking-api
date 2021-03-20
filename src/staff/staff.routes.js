"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const staffController = require("./customer.controller");

const router = express.Router();
router.post("/staff", logIncommingRequest, authenticateAccessToken, staffController.newStaff);
router.delete("/staff/:staffId", logIncommingRequest, authenticateAccessToken, staffController.deleteStaff);
router.put("/staff/status", logIncommingRequest, authenticateAccessToken, staffController.editStatus);
router.put("/staff/personal-info", logIncommingRequest, authenticateAccessToken, staffController.editPersonalInfo);
router.put("/staff/contact", logIncommingRequest, authenticateAccessToken, staffController.editContact);
router.put("/staff/picture", logIncommingRequest, authenticateAccessToken, staffController.editPicture);

router.get("/staffs", logIncommingRequest, authenticateAccessToken, staffController.searchCustomers);
router.get("/customer/:id", logIncommingRequest, authenticateAccessToken, staffController.findCustomer);

module.exports = router;
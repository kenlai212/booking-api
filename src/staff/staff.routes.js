"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const customerController = require("./customer.controller");

const router = express.Router();
router.post("/customer", logIncommingRequest, authenticateAccessToken, customerController.newCustomer);
router.get("/customers", logIncommingRequest, authenticateAccessToken, customerController.searchCustomers);
router.get("/customer/:id", logIncommingRequest, authenticateAccessToken, customerController.findCustomer);
router.delete("/customer/:customerId", logIncommingRequest, authenticateAccessToken, customerController.deleteCustomer);
router.put("/customer/status", logIncommingRequest, authenticateAccessToken, customerController.editStatus);
router.put("/customer/personal-info", logIncommingRequest, authenticateAccessToken, customerController.editPersonalInfo);
router.put("/customer/contact", logIncommingRequest, authenticateAccessToken, customerController.editContact);
router.put("/customer/picture", logIncommingRequest, authenticateAccessToken, customerController.editPicture);

module.exports = router;
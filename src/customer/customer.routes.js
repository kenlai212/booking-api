"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const customerController = require("./customer.controller");
const personController = require("./person.controller");

const router = express.Router();
router.post("/customer", logIncommingRequest, authenticateAccessToken, customerController.newCustomer);
router.get("/customers", logIncommingRequest, authenticateAccessToken, customerController.searchCustomers);
router.get("/customer", logIncommingRequest, authenticateAccessToken, customerController.findCustomer);
router.delete("/customer/:customerId", logIncommingRequest, authenticateAccessToken, customerController.deleteCustomer);
router.put("/customer/status", logIncommingRequest, authenticateAccessToken, customerController.updateStatus);

router.delete("/customers/:passcode", logIncommingRequest, authenticateAccessToken, customerController.deleteAllCustomers);

router.post("/customer/person", logIncommingRequest, authenticateAccessToken, personController.newPerson);
router.get("/customer/person/:personId", logIncommingRequest, authenticateAccessToken, personController.findPerson);
router.delete("/customer/people/:passcode", logIncommingRequest, authenticateAccessToken, personController.deleteAllPeople);

module.exports = router;
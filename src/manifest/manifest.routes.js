"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");

const manifestController = require("./manifest.controller");
const disclaimerController = require("./disclaimer.controller");
const customerController = require("./customer.controller");

router.post("/manifest", authenticateAccessToken, logIncommingRequest, manifestController.newManifest);
router.delete("/manifest/guest/:bookingId/:guestId", authenticateAccessToken, logIncommingRequest, manifestController.removeGuest);
router.put("/manifest/guest", authenticateAccessToken, logIncommingRequest, manifestController.addGuest);

router.put("/manifest/guest/disclaimer/notification", authenticateAccessToken, logIncommingRequest, disclaimerController.sendDisclaimerNotification);
router.put("/manifest/guest/disclaimer", logIncommingRequest, disclaimerController.signDisclaimer);

router.post("/manifest/customer", authenticateAccessToken, logIncommingRequest, customerController.newCustomer);
router.delete("/manifest/customers", authenticateAccessToken, logIncommingRequest, customerController.deleteAllCustomers);

module.exports = router;
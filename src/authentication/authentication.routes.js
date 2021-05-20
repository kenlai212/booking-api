"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");

const authenticationController = require("./authentication.controller");
const claimController = require("./claim.controller");
const credentialsController = require("./credentials.controller");

const router = express.Router();

router.post("/authentication/login", logIncommingRequest, authenticationController.login);
router.post("/authentication/register", logIncommingRequest, authenticationController.register);

router.post("/authentication/claim", authenticateAccessToken, logIncommingRequest, claimController.newClaim);
router.get("/authentication/claim/:userId", authenticateAccessToken, logIncommingRequest, claimController.findClaim);
router.delete("/authentication/claim/:userId", authenticateAccessToken, logIncommingRequest, claimController.deleteClaim);
router.put("/authentication/claim/group/add", authenticateAccessToken, logIncommingRequest, claimController.addGroup);
router.put("/authentication/claim/group/remove", authenticateAccessToken, logIncommingRequest, claimController.removeGroup);
router.put("/authentication/claim/role/add", authenticateAccessToken, logIncommingRequest, claimController.addRole);
router.put("/authentication/claim/role/remove", authenticateAccessToken, logIncommingRequest, claimController.removeRole);
router.delete("/authentication/claims/:passcode", authenticateAccessToken, logIncommingRequest, claimController.deleteAllClaims);

router.post("/authentication/credentials", logIncommingRequest, credentialsController.newCredentials);
router.get("/authentication/credentials", logIncommingRequest, credentialsController.readCredentials);
router.delete("/authentication/credentials", authenticateAccessToken, logIncommingRequest, credentialsController.deleteCredentials);
router.delete("/authentication/credentialses/:passcode", authenticateAccessToken, logIncommingRequest, credentialsController.deleteAllCredentialses);

module.exports = router;

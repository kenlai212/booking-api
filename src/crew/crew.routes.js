"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const crewController = require("./crew.controller");
const assignmentController = require("./assignment.controller");

const router = express.Router();
router.post("/crew", logIncommingRequest, authenticateAccessToken, crewController.newCrew);
router.get("/crews", logIncommingRequest, authenticateAccessToken, crewController.searchCrews);
router.get("/crew/:crewId", logIncommingRequest, authenticateAccessToken, crewController.findCrew);
router.delete("/crew/:crewId", logIncommingRequest, authenticateAccessToken, crewController.deleteCrew);
router.put("/crew/status", logIncommingRequest, authenticateAccessToken, crewController.editStatus);
router.put("/crew/contact", logIncommingRequest, authenticateAccessToken, crewController.editContact);

router.post("/assignment", logIncommingRequest, authenticateAccessToken, assignmentController.initAssignment);
router.put("/assignment/booking", logIncommingRequest, authenticateAccessToken, assignmentController.addAssignmentItem);

module.exports = router;

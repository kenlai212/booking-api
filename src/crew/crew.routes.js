"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");
const crewController = require("./crew.controller");
const assignmentHistoryController = require("./assignmentHistory.controller");

const router = express.Router();
router.post("/crew", logIncommingRequest, authenticateAccessToken, crewController.newCrew);
router.get("/crews", logIncommingRequest, authenticateAccessToken, crewController.searchCrews);
router.get("/crew/:crewId", logIncommingRequest, authenticateAccessToken, crewController.findCrew);
router.delete("/crew/:crewId", logIncommingRequest, authenticateAccessToken, crewController.deleteCrew);
router.put("/crew/status", logIncommingRequest, authenticateAccessToken, crewController.editStatus);
router.put("/crew/profile", logIncommingRequest, authenticateAccessToken, crewController.editProfile);

router.post("/assignment-history", logIncommingRequest, authenticateAccessToken, assignmentHistoryController.initAssignmentHistory);
router.put("/assignment-history/assignment", logIncommingRequest, authenticateAccessToken, assignmentHistoryController.addAssignment);
router.get("/assignment-history/:crewId", logIncommingRequest, authenticateAccessToken, assignmentHistoryController.getAssignmentHistory);
router.delete("/assignment-history/:crewId", logIncommingRequest, authenticateAccessToken, assignmentHistoryController.deleteAssignmentHistory);
router.delete("/assignment-history/assignment/:crewId/:bookingId", logIncommingRequest, authenticateAccessToken, assignmentHistoryController.removeAssignment);

module.exports = router;

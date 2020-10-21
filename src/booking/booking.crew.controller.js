"use strict";
const crewService = require("./booking.crew.service");
const asyncMiddleware = require("../common/middleware/asyncMiddleware");

const assignCrew = asyncMiddleware(async (req, res) => {
	return await crewService.assignCrew(req.body, req.user);
});

const relieveCrew = asyncMiddleware(async (req, res) => {
	return await crewService.relieveCrew(req.params, req.user);
});

module.exports = {
	assignCrew,
	relieveCrew
}

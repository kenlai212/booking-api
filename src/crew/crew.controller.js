"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const crewService = require("./crew.service");

const newCrew = asyncMiddleware(async (req) => {
	return await crewService.newCrew(req.body, req.user);
});

const findCrew = asyncMiddleware(async (req) => {
	return await crewService.findCrew(req.params, req.user);
});

const searchCrews = asyncMiddleware(async (req, res) => {
	return await crewService.searchCrews(null, req.user);
});

const deleteCrew = asyncMiddleware(async (req, res) => {
	return await crewService.deleteCrew(req.params, req.user);
});

module.exports = {
	newCrew,
	searchCrews,
	findCrew,
	deleteCrew
}
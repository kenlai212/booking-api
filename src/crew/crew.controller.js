"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const crewService = require("./crew.service");

const newCrew = asyncMiddleware(async (req) => {
	return await crewService.newCrew(req.body, req.user);
});

const findCrew = asyncMiddleware(async (req) => {
	const queryObject = url.parse(req.url, true).query;
	return await crewService.findCrew(queryObject, req.user);
});

const searchCrews = asyncMiddleware(async (req, res) => {
	return await crewService.searchCrews(null, req.user);
});

module.exports = {
	newCrew,
	searchCrews,
	findCrew
}
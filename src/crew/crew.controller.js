"use strict";
const url = require("url");
const crewService = require("./crew.service");

const newCrew = asyncMiddleware(async (req) => {
	return await crewService.newCrew(req.body, req.user);
});

const findCrew = asyncMiddleware(async (req) => {
	const queryObject = url.parse(req.url, true).query;
	return await crewService.findCrew(queryObject, req.user);
});

const searchCrews = async (req, res) => {
	return await crewService.searchCrews(req.user);
}

module.exports = {
	newCrew,
	searchCrews,
	findCrew
}
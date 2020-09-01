"use strict";
const crewService = require("./booking.crew.service");
const asyncMiddleware = require("../common/middleware/asyncMiddleware");

const addCrew = asyncMiddleware(async (req, res) => {
	return await crewService.addCrew(req.body, req.user);
});

module.exports = {
	addCrew
}

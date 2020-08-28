"use strict";
const crewService = require("./booking.crew.service");

const addCrew = async (req, res) => {
	return await crewService.addCrew(req.body, req.user);
}

module.exports = {
	addCrew
}

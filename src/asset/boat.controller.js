"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const boatService = require("./boat.service");

const newBoat = asyncMiddleware(async (req) => {
	return await boatService.newBoat(req.body, req.user);
});

const setFuelPercentage = asyncMiddleware(async (req) => {
	return await boatService.setFuelPercentage(req.body, req.user);
});

module.exports = {
	newBoat,
	setFuelPercentage
}
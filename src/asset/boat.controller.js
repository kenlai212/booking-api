"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const boatService = require("./boat.service");

const newBoat = asyncMiddleware(async (req) => {
	return await boatService.newBoat(req.body, req.user);
});

const setFuelLevel = asyncMiddleware(async (req) => {
	return await boatService.setFuelLevel(req.body, req.user);
});

const findBoat = asyncMiddleware(async (req) => {
	console.log(req.params);
	return await boatService.findBoat(req.params, req.user);
});

module.exports = {
	newBoat,
	setFuelLevel,
	findBoat
}
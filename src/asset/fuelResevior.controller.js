"use strict";
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const fuelReserviorService = require("./fuelReservior.service");

const newFuelReservior = asyncMiddleware(async (req) => {
	return await fuelReserviorService.newFuelReservior(req.body, req.user);
});

const editCanisters = asyncMiddleware(async (req) => {
	return await fuelReserviorService.editCanisters(req.body, req.user);
});

const findFuelReservior = asyncMiddleware(async (req) => {
	return await fuelReserviorService.findFuelReservior(req.params, req.user);
});

module.exports = {
	newFuelReservior,
	editCanisters,
	findFuelReservior
}
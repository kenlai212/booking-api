"use strict";
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const fuelReserviorService = require("./fuelReservior.service");

const newFuelReservior = asyncMiddleware(async (req) => {
	return await fuelReserviorService.newFuelReservior(req.body, req.user);
});

const editCanisters = asyncMiddleware(async (req) => {
	return await fuelReserviorService.editCanisters(req.body, req.user);
});

module.exports = {
	newFuelReservior,
	editCanisters
}
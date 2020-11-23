"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const occupancyService = require("./occupancy.service");

const availability = asyncMiddleware(async (req) => {
	const queryObject = url.parse(req.url, true).query;
	return await occupancyService.checkAvailability(queryObject, req.user);
});

const newOccupancy = asyncMiddleware(async (req) => {
	return await occupancyService.occupyAsset(req.body, req.user);
});

const getOccupancies = asyncMiddleware(async (req) => {
	const queryObject = url.parse(req.url, true).query;
	return await occupancyService.getOccupancies(queryObject, req.user);
});

const cancelOccupancy = asyncMiddleware(async (req) => {
	return await occupancyService.releaseOccupancy(req.body, req.user);
});

const updateBookingId = asyncMiddleware(async (req) => {
	return await occupancyService.updateBookingId(req.body, req.user);
});

module.exports = {
	getOccupancies,
	newOccupancy,
	availability,
	cancelOccupancy,
	updateBookingId
}
"use strict";
const url = require("url");
const common = require("gogowake-common");
const occupancyService = require("./occupancy.service");

require('dotenv').config();

//check availability by startTime and endTime and assetId
const availability = async (req, res) => {
	common.logIncommingRequest(req);

	const queryObject = url.parse(req.url, true).query;

	try {
		const response = await occupancyService.checkAvailability(queryObject, req.user);
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

//add new occupancy
const newOccupancy = async (req, res) => {
	common.logIncommingRequest(req);
	
	try {
		const response = await occupancyService.occupyAsset(req.body, req.user);
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}
	
	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});
	
	return res;
}

//get occupancies by startTime and endTime and assetId
const getOccupancies = async (req, res) => {
	common.logIncommingRequest(req);

	const queryObject = url.parse(req.url, true).query;
	
	try {
		const response = await occupancyService.getOccupancies(queryObject, req.user);
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

//cancel occupancy
const cancelOccupancy = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await occupancyService.releaseOccupancy(req.body, req.user);
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

module.exports = {
	getOccupancies,
	newOccupancy,
	availability,
	cancelOccupancy
}
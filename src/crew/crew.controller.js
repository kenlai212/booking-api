"use strict";
const url = require("url");
const common = require("gogowake-common");
const crewService = require("./crew.service");

require('dotenv').config();

const newCrew = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await crewService.newCrew(req.body, req.user);
		common.readySuccessResponse(response, res);
	} catch (err) {
		res.status(err.status);
		res.json({ "error" : err.message });
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const findCrew = async (req, res) => {
	common.logIncommingRequest(req);

	const queryObject = url.parse(req.url, true).query;

	try {
		const response = await crewService.findCrew(queryObject, req.user);
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const searchCrews = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await crewService.searchCrews(req.user);
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
	newCrew,
	searchCrews,
	findCrew
}
"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const credentialsService = require("./credentials.service");

const checkLoginIdAvailability = asyncMiddleware(async (req) => {
	const queryObject = url.parse(req.url, true).query;
	return await credentialsService.checkLoginIdAvailability(queryObject);
});

const addNewCredentials = asyncMiddleware(async (req) => {
	return await credentialsService.addNewCredentials(req.body);
});

module.exports = {
	checkLoginIdAvailability,
	addNewCredentials
}
"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const authService = require("./authentication.service");

const checkLoginIdAvailability = asyncMiddleware(async (req) => {
	const queryObject = url.parse(req.url, true).query;
	return await authService.checkLoginIdAvailability(queryObject);
});

const addNewCredentials = asyncMiddleware(async (req) => {
	return await authService.addNewCredentials(req.body);
});

const login = asyncMiddleware(async (req) => {
	return await authService.login(req.body);
});

const socialLogin = asyncMiddleware(async (req) => {
	return await authService.socialLogin(req.body);
});

module.exports = {
	checkLoginIdAvailability,
	addNewCredentials,
	login,
	socialLogin
}
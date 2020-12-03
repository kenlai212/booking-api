"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const userService = require("./user.service");

const findUser = asyncMiddleware(async (req) => {
	const queryObject = url.parse(req.url, true).query;
	return await userService.findUser(queryObject);
});

const findSocialUser = asyncMiddleware(async (req) => {
	const queryObject = url.parse(req.url, true).query;
	return await userService.findSocialUser(queryObject);
});

const forgetPassword = asyncMiddleware(async (req) => {
	return await userService.forgetPassword(req.body);
});

const updateContactInfo = asyncMiddleware(async (req) => {
	return await userService.updateContactInfo(req.body, req.user);
});

const activate = asyncMiddleware(async (req) => {
	return await userService.activate(req.body);
});

const updateLastLogin = asyncMiddleware(async (req) => {
	return await userService.updateLastLogin(req.body, req.user);
});

module.exports = {
	findUser,
	findSocialUser,
	forgetPassword,
	updateContactInfo,
	activate,
	updateLastLogin
}

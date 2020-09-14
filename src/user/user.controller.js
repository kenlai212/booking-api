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

const updateEmailAddress = asyncMiddleware(async (req) => {
	await userService.updateEmailAddress(req.body);
});

const updateTelephoneNumber = asyncMiddleware(async (req) => {
	await userService.updateTelephoneNumber(req.body);
});

module.exports = {
	findUser,
	findSocialUser,
	forgetPassword,
	updateEmailAddress,
	updateTelephoneNumber
}

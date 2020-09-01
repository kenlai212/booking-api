"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const userService = require("./user.service");

const deactivate = asyncMiddleware(async (req) => {
	return await userService.deactivateUser(req.body);
});

const activate = asyncMiddleware(async (req) => {
	return await userService.activateUser(req.body);
});

const adminActivate = asyncMiddleware(async (req) => {
	return await userService.adminActivateUser(req.body);
});

const register =asyncMiddleware( async (req) => {
	return await userService.register(req.body);
});

const activateEmail = asyncMiddleware(async (req) => {
	return await userService.sendActivationEmail(req.body);
});

const searchUsers = asyncMiddleware(async (req) => {
	return await userService.fetchAllUsers();
});

const findUser = asyncMiddleware(async (req) => {
	const queryObject = url.parse(req.url, true).query;
	return await userService.findUser(queryObject);
});

const updateEmailAddress = asyncMiddleware(async (req) => {
	await userService.updateEmailAddress(req.body);
});

const assignGroup = asyncMiddleware(async (req) => {
	await userService.assignGroup(req.body);
});

module.exports = {
	deactivate,
	activate,
	adminActivate,
	register,
	activateEmail,
	searchUsers,
	findUser,
	updateEmailAddress,
	assignGroup
}

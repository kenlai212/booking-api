"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const userService = require("./user.service");

const findUser = asyncMiddleware(async (req) => {
	return await userService.findUser(req.params);
});

const findSocialUser = asyncMiddleware(async (req) => {
	const queryObject = url.parse(req.url, true).query;
	return await userService.findSocialUser(queryObject);
});

const activate = asyncMiddleware(async (req) => {
	return await userService.activate(req.body);
});

const updateLastLogin = asyncMiddleware(async (req) => {
	return await userService.updateLastLogin(req.body, req.user);
});

const editPersonalInfo = asyncMiddleware(async (req) => {
	return await userService.editPersonalInfo(req.body, req.user);
});

const editContact = asyncMiddleware(async (req) => {
	return await userService.editContact(req.body, req.user);
});

const editPicture = asyncMiddleware(async (req) => {
	return await userService.editPicture(req.body, req.user);
});

module.exports = {
	findUser,
	findSocialUser,
	activate,
	updateLastLogin,
	editPersonalInfo,
	editContact,
	editPicture
}

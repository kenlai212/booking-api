"use strict";
const url = require("url");
const common = require("gogowake-common");
const userService = require("./user.service");

const deactivate = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await userService.deactivateUser(req.body);
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const activate = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await userService.activateUser(req.body);
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const adminActivate = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await userService.adminActivateUser(req.body);
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const register = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await userService.register(req.body);
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);

	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const activateEmail = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await userService.sendActivationEmail(req.body);
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);

	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const searchUsers = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await userService.fetchAllUsers();
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const findUser = async (req, res) => {
	common.logIncommingRequest(req);

	const queryObject = url.parse(req.url, true).query;

	try {
		const response = await userService.findUser(queryObject);
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const updateEmailAddress = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await userService.updateEmailAddress(req.body);
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const assignGroup = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await userService.assignGroup(req.body);
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

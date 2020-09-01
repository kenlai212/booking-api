"use strict";
const url = require("url");
const common = require("gogowake-common");
const authService = require("./authentication.service");

require('dotenv').config();

const checkLoginIdAvailability = async (req, res) => {
	common.logIncommingRequest(req);

	const queryObject = url.parse(req.url, true).query;

	try {
		const response = await authService.checkLoginIdAvailability(queryObject);
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const addNewCredentials = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await authService.addNewCredentials(req.body);
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const login = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await authService.login(req.body);
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const getNewAccessToken = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await authService.getNewAccessToken(req.body);
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const logout = async (req, res) => {
	common.logIncommingRequest(req);

	try {
		const response = await authService.logout(req.body);
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
	checkLoginIdAvailability,
	addNewCredentials,
	login,
	getNewAccessToken,
	logout
}
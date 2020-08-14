"use strict";
const gogowakeCommon = require("gogowake-common");
const guestService = require("./guest.service");

const removeGuest = async (req, res) => {
	gogowakeCommon.logIncommingRequest(req);
	
	try {
		const response = await guestService.removeGuest(req.body, req.user)
		gogowakeCommon.readySuccessResponse(response, res);
	} catch (err) {
		gogowakeCommon.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		gogowakeCommon.logOutgoingResponse(res);
	});
	
	return res;
	
	
}

const addGuest = async (req, res) => {
	gogowakeCommon.logIncommingRequest(req);

	try {
		const response = await guestService.addGuest(req.body, req.user)
		gogowakeCommon.readySuccessResponse(response, res);
	} catch (err) {
		gogowakeCommon.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		gogowakeCommon.logOutgoingResponse(res);
	});

	return res;
}

const editGuest = async (req, res) => {
	gogowakeCommon.logIncommingRequest(req);

	try {
		const response = await guestService.editGuest(req.body, req.user)
		gogowakeCommon.readySuccessResponse(response, res);
	} catch (err) {
		gogowakeCommon.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		gogowakeCommon.logOutgoingResponse(res);
	});

	return res;
}

const sendDisclaimer = async (req, res) => {
	gogowakeCommon.logIncommingRequest(req);

	try {
		const response = await guestService.sendDisclaimer(req.body, req.user)
		gogowakeCommon.readySuccessResponse(response, res);
	} catch (err) {
		gogowakeCommon.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		gogowakeCommon.logOutgoingResponse(res);
	});

	return res;
}

const signDisclaimer = async (req, res) => {
	gogowakeCommon.logIncommingRequest(req);

	try {
		const response = await guestService.signDisclaimer(req.body)
		gogowakeCommon.readySuccessResponse(response, res);
	} catch (err) {
		gogowakeCommon.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		gogowakeCommon.logOutgoingResponse(res);
	});

	return res;
}

module.exports = {
	addGuest,
	removeGuest,
	editGuest,
	sendDisclaimer,
	signDisclaimer
}

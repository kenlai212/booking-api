"use strict";
const url = require("url");
const slotService = require("./slot.service");
const common = require("gogowake-common");

require('dotenv').config();

const slots = async (req, res) => {
	common.logIncommingRequest(req);

	const queryObject = url.parse(req.url, true).query;

	try {
		const response = await slotService.getSlots(queryObject, req.user)
		common.readySuccessResponse(response, res);
	} catch (err) {
		common.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		common.logOutgoingResponse(res);
	});

	return res;
}

const endSlots = async (req, res) => {
	common.logIncommingRequest(req);

	const queryObject = url.parse(req.url, true).query;

	try {
		const response = await slotService.getEndSlots(queryObject, req.user)
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
	slots,
	endSlots
}

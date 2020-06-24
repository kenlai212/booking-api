"use strict";
const url = require("url");
const slotService = require("./slot.service");
const common = require("gogowake-common");
const logger = common.logger;

require('dotenv').config();

const slots = async (req, res) => {
	common.logIncommingRequest(req);

	const queryObject = url.parse(req.url, true).query;

	try {
		const response = await slotService.getSlots(queryObject, req.user)
		logger.info("Response Body : " + JSON.stringify(response));
		res.json(response);
		res.status(200);
	} catch (err) {
		console.log(err);
		res.status(err.status);
		res.json({ "error": err.message });
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
		logger.info("Response Body : " + JSON.stringify(response));
		res.json(response);
		res.status(200);
	} catch (err) {
		res.status(err.status);
		res.json({ "error": err.message });
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
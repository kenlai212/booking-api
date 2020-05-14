"use strict";
const url = require("url");
const helper = require("./helper");
const logger = require("./logger");
const slotService = require("./slot.service");

require('dotenv').config();

const slots = async (req, res) => {
	helper.logIncommingRequest(req);

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
		helper.logOutgoingResponse(res);
	});

	return res;
}

const endSlots = async (req, res) => {
	helper.logIncommingRequest(req);

	const queryObject = url.parse(req.url, true).query;

	try {
		const response = await slotService.getAvailableEndSlots(queryObject, req.user)
		logger.info("Response Body : " + JSON.stringify(response));
		res.json(response);
		res.status(200);
	} catch (err) {
		console.log(err);
		res.status(err.status);
		res.json({ "error": err.message });
	}

	res.on("finish", function () {
		helper.logOutgoingResponse(res);
	});

	return res;
}

module.exports = {
	slots,
	endSlots
}

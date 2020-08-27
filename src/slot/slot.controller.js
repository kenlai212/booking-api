"use strict";
const url = require("url");

const asyncMiddleware = require("../middleware/asyncMiddleware");
const slotService = require("./slot.service");

const slots = asyncMiddleware(async (req, res) => {
	const queryObject = url.parse(req.url, true).query;
	return await slotService.getSlots(queryObject, req.user);
});

const endSlots = asyncMiddleware(async (req, res) => {
	const queryObject = url.parse(req.url, true).query;
	return await slotService.getEndSlots(queryObject, req.user);
});

module.exports = {
	slots,
	endSlots
}

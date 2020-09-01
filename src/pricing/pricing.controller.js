"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const pricingService = require("./pricing.service");

const totalAmount = asyncMiddleware(async (req) => {
	const queryObject = url.parse(req.url, true).query;
	return await pricingService.calculateTotalAmount(queryObject, req.user)
});

module.exports = {
	totalAmount
}

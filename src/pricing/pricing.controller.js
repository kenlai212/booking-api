"use strict";
const url = require("url");
const pricingService = require("./pricing.service");
const common = require("gogowake-common");

require('dotenv').config();

const totalAmount = async (req, res) => {
	common.logIncommingRequest(req);

	const queryObject = url.parse(req.url, true).query;

	try {
		const response = pricingService.calculateTotalAmount(queryObject, req.user)
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
	totalAmount
}

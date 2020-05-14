"use strict";
const url = require("url");
const helper = require("./helper");
const logger = require("./logger");
const pricingService = require("./pricing.service");

require('dotenv').config();

const totalAmount = async (req, res) => {
	helper.logIncommingRequest(req);

	const queryObject = url.parse(req.url, true).query;

	try {
		const response = pricingService.calculateTotalAmount(queryObject, req.user)
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
	totalAmount
}

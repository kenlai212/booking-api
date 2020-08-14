"use strict";
const paymentService = require("./payment.service");
const gogowakeCommon = require("gogowake-common");

const makePayment = async (req, res) => {
	gogowakeCommon.logIncommingRequest(req);

	try {
		const response = await paymentService.makePayment(req.body, req.user)
		gogowakeCommon.readySuccessResponse(response, res);
	} catch (err) {
		gogowakeCommon.readyErrorResponse(err, res);
	}

	res.on("finish", function () {
		gogowakeCommon.logOutgoingResponse(res);
	});

	return res;
}

const applyDiscount = async (req, res) => {
	gogowakeCommon.logIncommingRequest(req);

	try {
		const response = await paymentService.applyDiscount(req.body, req.user)
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
	makePayment,
	applyDiscount
}

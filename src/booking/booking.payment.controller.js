"use strict";
const paymentService = require("./booking.payment.service");
const asyncMiddleware = require("../common/middleware/asyncMiddleware");

const makePayment = asyncMiddleware(async (req) => {
	return await paymentService.makePayment(req.body, req.user);
});

const applyDiscount = asyncMiddleware(async (req) => {
	return await paymentService.applyDiscount(req.body, req.user);
});

module.exports = {
	makePayment,
	applyDiscount
}

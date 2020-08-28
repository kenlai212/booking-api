"use strict";
const paymentService = require("./booking.payment.service");

const makePayment = async (req) => {
	return await paymentService.makePayment(req.body, req.user);
}

const applyDiscount = async (req) => {
	return await paymentService.applyDiscount(req.body, req.user);
}

module.exports = {
	makePayment,
	applyDiscount
}

"use strict";
const invoiceService = require("./booking.invoice.service");
const asyncMiddleware = require("../common/middleware/asyncMiddleware");

const makePayment = asyncMiddleware(async (req) => {
	return await invoiceService.makePayment(req.body, req.user);
});

const applyDiscount = asyncMiddleware(async (req) => {
	return await invoiceService.applyDiscount(req.body, req.user);
});

const removeDiscount = asyncMiddleware(async (req) => {
	return await invoiceService.removeDiscount(req.params, req.user);
});

module.exports = {
	makePayment,
	applyDiscount,
	removeDiscount
}

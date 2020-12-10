"use strict";
const invoiceService = require("./booking.invoice.service");
const userAuthorization = require("../../common/middleware/userAuthorization");
const asyncMiddleware = require("../../common/middleware/asyncMiddleware");
const customError = require("../../common/customError");

const makePayment = asyncMiddleware(async (req) => {
	//validate user
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await invoiceService.makePayment(req.body, req.user);
});

const applyDiscount = asyncMiddleware(async (req) => {
	//validate user
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP
	]

	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await invoiceService.applyDiscount(req.body, req.user);
});

const removeDiscount = asyncMiddleware(async (req) => {
	//validate user
	const rightsGroup = [
		bookingCommon.BOOKING_ADMIN_GROUP
	]
	
	if (userAuthorization(req.user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	return await invoiceService.removeDiscount(req.params, req.user);
});

module.exports = {
	makePayment,
	applyDiscount,
	removeDiscount
}

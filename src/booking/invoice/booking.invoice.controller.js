"use strict";
const asyncMiddleware = require("../../common/middleware/asyncMiddleware");
const utility = require("../../common/utility");

const bookingCommon = require("../booking.common");
const invoiceService = require("./booking.invoice.service");

const makePayment = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [
		bookingCommon.BOOKING_ADMIN_GROUP,
		bookingCommon.BOOKING_USER_GROUP
	]);

	return await invoiceService.makePayment(req.body, req.user);
});

const applyDiscount = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [
		bookingCommon.BOOKING_ADMIN_GROUP
	]);

	return await invoiceService.applyDiscount(req.body, req.user);
});

const removeDiscount = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [
		bookingCommon.BOOKING_ADMIN_GROUP
	]);

	return await invoiceService.removeDiscount(req.params, req.user);
});

module.exports = {
	makePayment,
	applyDiscount,
	removeDiscount
}
